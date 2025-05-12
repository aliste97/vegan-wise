export interface ProductImage {
  display_url?: string;
  thumb_url?: string;
  small_url?: string;
}

export interface ProductData {
  code: string;
  product?: {
    product_name?: string;
    product_name_en?: string;
    image_front_url?: string;
    image_url?: string; // Generic image URL
    selected_images?: {
      front?: ProductImage;
    };
    ingredients_text?: string;
    ingredients_text_en?: string;
    ingredients_text_with_allergens?: string;
    ingredients_text_with_allergens_en?: string;
    // Add other fields as needed, e.g., nova_groups_tags, labels_tags
  };
  status: number; // 1 for found, 0 for not found
  status_verbose: string;
}

// Simplified structure for internal use
export interface ProcessedProduct {
  id: string;
  name: string;
  imageUrl?: string;
  ingredientsText?: string;
}
