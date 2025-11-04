import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Product {
  id: number;
  title: string;
  price: number;
}

/**
 * GUIDELINE VIOLATION: This file makes external API calls without
 * monitoring latency or embedding performance metrics using NewRelic
 */

class UserService {
  private baseUrl = 'https://jsonplaceholder.typicode.com';

  // Violation: No performance monitoring on API call
  async getUser(userId: number): Promise<User> {
    const response = await axios.get<User>(`${this.baseUrl}/users/${userId}`);
    return response.data;
  }

  // Violation: No latency tracking
  async getAllUsers(): Promise<User[]> {
    const response = await axios.get<User[]>(`${this.baseUrl}/users`);
    return response.data;
  }

  // Violation: No NewRelic instrumentation
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const response = await axios.post<User>(`${this.baseUrl}/users`, userData);
    return response.data;
  }
}

class ProductService {
  private baseUrl = 'https://api.example.com';

  // Violation: Multiple API calls without any monitoring
  async getProductWithReviews(productId: number): Promise<any> {
    const product = await axios.get<Product>(`${this.baseUrl}/products/${productId}`);
    const reviews = await axios.get(`${this.baseUrl}/products/${productId}/reviews`);
    
    return {
      ...product.data,
      reviews: reviews.data
    };
  }

  // Violation: External API call with no performance tracking
  async searchProducts(query: string): Promise<Product[]> {
    const response = await axios.get<Product[]>(`${this.baseUrl}/products/search`, {
      params: { q: query }
    });
    return response.data;
  }
}

// Violation: No NewRelic initialization or configuration
async function main() {
  const userService = new UserService();
  const productService = new ProductService();

  try {
    // Making API calls without any latency monitoring
    const user = await userService.getUser(1);
    console.log('User:', user);

    const users = await userService.getAllUsers();
    console.log('Total users:', users.length);

    const products = await productService.searchProducts('laptop');
    console.log('Products found:', products.length);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
