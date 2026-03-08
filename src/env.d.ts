/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    admin?: {
      sub: string;
      iat: number;
      exp: number;
    };
  }
}