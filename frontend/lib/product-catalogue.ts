export type CatalogueProduct = {
  slug: string;
  name: string;
  icon: "learning" | "book" | "messages" | "audio" | "people";
  image: string;
  imageAlt: string;
  description: string;
  destination?: string;
  destinationVerified: boolean;
};

/**
 * Product names and the two supplied platform URLs are verified from the
 * current request. Other platform URLs and product capabilities are not.
 */
export const productCatalogue: CatalogueProduct[] = [
  {
    slug: "skillhub",
    name: "SkillHub",
    icon: "learning",
    image: "/products/skillhub-learning.jpg",
    imageAlt: "Adult learners collaborating around a laptop during a professional skills workshop.",
    description: "A digital skills and learning platform for developing practical skills and supporting professional growth.",
    destination: "https://skillhub.meritlives.com/login",
    destinationVerified: true,
  },
  {
    slug: "bookmarketing",
    name: "BookMarketing",
    icon: "book",
    image: "/products/bookmarketing-author.jpg",
    imageAlt: "An author and publishing professional reviewing books and marketing materials together.",
    description: "A product focused on book marketing and author promotion. Additional features are being confirmed.",
    destinationVerified: false,
  },
  {
    slug: "wauabot",
    name: "Wauabot",
    icon: "messages",
    image: "/products/wauabot-customer-conversation.jpg",
    imageAlt: "A small business owner speaking with a customer by smartphone at a shop counter.",
    description: "Product details are being confirmed. We will describe its messaging or automation capabilities once verified.",
    destinationVerified: false,
  },
  {
    slug: "audioflow",
    name: "Audioflow",
    icon: "audio",
    image: "/products/audioflow-presenter.jpg",
    imageAlt: "An audio presenter wearing headphones and speaking into a studio microphone.",
    description: "An audio-focused digital platform. Its specific features are being confirmed.",
    destination: "https://audioflow.meritlives.com/",
    destinationVerified: true,
  },
  {
    slug: "politcs",
    name: "Politcs",
    icon: "people",
    image: "/products/politcs-professional-meeting.jpg",
    imageAlt: "A diverse group of professionals in a neutral discussion meeting; Politcs product purpose is unconfirmed.",
    description: "The product's purpose and current access details are being confirmed.",
    destinationVerified: false,
  },
];

export function getCatalogueProduct(slug: string): CatalogueProduct | undefined {
  return productCatalogue.find((product) => product.slug === slug.toLowerCase());
}
