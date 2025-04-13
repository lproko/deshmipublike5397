import api from "./api";

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  email: string;
  role: string;
}

const userService = {
  login: async (username: string, password: string): Promise<User> => {
    try {
      // JSON Server doesn't have authentication, so we need to fetch users and filter
      const response = await api.get(`/users?username=${username}`);
      const users = response.data;

      if (users.length > 0 && users[0].password === password) {
        return users[0];
      } else {
        return Promise.reject(new Error("Invalid username or password"));
      }
    } catch (error) {
      return Promise.reject(error);
    }
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem("currentUser");
    return userStr ? JSON.parse(userStr) : null;
  },

  setCurrentUser: (user: User | null): void => {
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("currentUser");
    }
  },
};

export default userService;
