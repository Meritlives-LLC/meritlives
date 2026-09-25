export interface Product {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  description?: string;
  logo?: string;
  cover_image?: string;
  website_url?: string;
  cta_text?: string;
  status: string;
  featured: boolean;
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  description?: string;
  icon?: string;
  featured: boolean;
  status: string;
}
