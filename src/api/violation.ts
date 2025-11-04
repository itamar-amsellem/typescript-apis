import express, { Request, Response } from 'express';

const router = express.Router();

interface User {
  id: string;
  email: string;
  name: string;
  age: number;
}

const users: User[] = [];

// VIOLATION: Inconsistent error responses - sometimes string, sometimes object
router.post('/users', (req: Request, res: Response) => {
  const { email, name, age } = req.body;
  
  if (!email) {
    // VIOLATION: Returns 500 for validation error, should be 400
    // VIOLATION: Returns plain string instead of structured error
    return res.status(500).send('Email is required');
  }
  
  if (!name) {
    // VIOLATION: Returns 200 with error message - wrong status code
    return res.status(200).json({ message: 'Name missing' });
  }
  
  if (age < 18) {
    // VIOLATION: Returns different error format (array)
    return res.status(400).json(['Age must be 18 or older']);
  }
  
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    // VIOLATION: Returns 400 for conflict, should be 409
    // VIOLATION: Different error structure again
    return res.status(400).json({ 
      error: 'User exists',
      userId: existingUser.id  // VIOLATION: Exposing internal data in error
    });
  }
  
  const user = { id: Math.random().toString(), email, name, age };
  users.push(user);
  res.status(201).json(user);
});

// VIOLATION: Multiple inconsistent error patterns
router.get('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    // VIOLATION: Plain text error with wrong status code
    return res.status(500).send('ID parameter missing');
  }
  
  const user = users.find(u => u.id === id);
  
  if (!user) {
    // VIOLATION: Sometimes returns 404 with different formats
    return res.status(404).json({ msg: 'Not found' });
  }
  
  res.json(user);
});

// VIOLATION: No consistent error handling for different error types
router.put('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, name, age } = req.body;
  
  const user = users.find(u => u.id === id);
  
  if (!user) {
    // VIOLATION: Different 404 format than GET endpoint
    return res.status(404).send('User not found');
  }
  
  if (email && email.length < 3) {
    // VIOLATION: Returns 422 inconsistently (sometimes 400, sometimes 422)
    return res.status(422).json({ validation: 'Invalid email' });
  }
  
  // VIOLATION: No validation error for required fields
  Object.assign(user, { email, name, age });
  res.json(user);
});

// VIOLATION: Throws unhandled exceptions that leak to default error handler
router.delete('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    // VIOLATION: Throws error instead of returning proper response
    throw new Error('User does not exist');
  }
  
  users.splice(index, 1);
  
  // VIOLATION: Returns 200 for delete instead of 204
  res.status(200).json({ success: true });
});

// VIOLATION: Database errors leak implementation details
router.post('/users/bulk', async (req: Request, res: Response) => {
  const { userList } = req.body;
  
  try {
    if (!Array.isArray(userList)) {
      // VIOLATION: Generic "bad request" without specifics
      return res.status(400).send('Bad request');
    }
    
    // Simulate database operation
    const result = await Promise.all(
      userList.map(async (u: any) => {
        if (!u.email) throw new Error('Email required');
        return u;
      })
    );
    
    res.status(201).json(result);
  } catch (error: any) {
    // VIOLATION: Exposes stack trace and internal error details
    // VIOLATION: Returns 500 for validation errors
    res.status(500).json({
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
  }
});

// VIOLATION: Business logic errors don't use appropriate status codes
router.post('/users/:id/upgrade', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  
  if (!user) {
    // VIOLATION: Yet another 404 format
    return res.status(404).json({ 
      error_message: 'Cannot find user',
      error_type: 'NOT_FOUND'
    });
  }
  
  if (user.age < 21) {
    // VIOLATION: Business rule violation returns 400 instead of 422
    // VIOLATION: Inconsistent field names (error_msg vs message vs msg)
    return res.status(400).json({ error_msg: 'Too young' });
  }
  
  res.json({ upgraded: true });
});

// VIOLATION: No error response at all for some edge cases
router.get('/users', (req: Request, res: Response) => {
  const { limit } = req.query;
  
  if (limit && isNaN(Number(limit))) {
    // VIOLATION: Just returns empty array instead of validation error
    return res.json([]);
  }
  
  const limitNum = Number(limit) || users.length;
  res.json(users.slice(0, limitNum));
});

export default router;
