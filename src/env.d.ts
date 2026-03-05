/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
    interface Locals {
      adminUser?: import('@supabase/supabase-js').User;
      adminToken?: string;
    }
  }