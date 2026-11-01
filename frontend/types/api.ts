export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  type?: string;
  status?: string;
}

export interface ProductFeature {
  id: number;
  name: string;
  description?: string | null;
  sort_order?: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  logo?: string | null;
  cover_image?: string | null;
  website_url?: string | null;
  cta_text?: string | null;
  status: string;
  featured: boolean;
  features?: ProductFeature[];
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  icon?: string | null;
  featured: boolean;
  sort_order?: number;
  status: string;
  seo?: {
    title?: string | null;
    description?: string | null;
  };
}

export interface NewsItem {
  featured_image_alt?: string | null;
  featured_image_disclosure?: string | null;
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  source?: {
    name?: string | null;
    url?: string | null;
  };
  image_url?: string | null;
  featured_image?: string | null;
  content?: string | null;
  author_name?: string | null;
  category?: Category | null;
  published_at?: string | null;
  updated_at?: string | null;
  featured: boolean;
}

export interface BlogPost {
  featured_image_alt?: string | null;
  featured_image_disclosure?: string | null;
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  featured_image?: string | null;
  author?: { id?: number; name?: string } | null;
  category?: Category | null;
  tags?: { id: number; name: string; slug: string }[];
  status: string;
  published_at?: string | null;
  featured: boolean;
  seo?: {
    title?: string | null;
    description?: string | null;
    canonical_url?: string | null;
  };
}

export interface FeaturedStory {
  id: string;
  type: "news" | "blog";
  title: string;
  slug: string;
  excerpt?: string | null;
  image?: string | null;
  publishedAt?: string | null;
  author?: string | null;
  source?: string | null;
  category?: Category | null;
  url: string;
}

export interface Paginated<T> {
  data: T[];
  links?: {
    first?: string;
    last?: string;
    prev?: string | null;
    next?: string | null;
  };
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}
