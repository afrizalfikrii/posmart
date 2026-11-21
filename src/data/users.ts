import type { User } from "@/types";

export const mockUsers: User[] = [
  {
    id: "user-01",
    name: "John Doe",
    email: "admin@posymart.id",
    phone: "081234567890",
    pin: "123456",
    role: "Admin",
    initials: "JD",
    active: true,
  },
  {
    id: "user-02",
    name: "Siti Aminah",
    email: "kasir@posymart.id",
    phone: "081298765432",
    pin: "123456",
    role: "Kasir",
    initials: "SA",
    active: true,
  },
];
