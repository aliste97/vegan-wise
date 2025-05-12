"use client";

import type React from 'react';
import Image from 'next/image';
import type { ProcessedProduct } from '@/types/product';
import IngredientHighlight from './IngredientHighlight';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PackageOpen } from 'lucide-react';

interface ProductDetailsProps {
  product: ProcessedProduct | null;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  if (!product) {
    return null; // Or some placeholder/message if needed when product is null but component is rendered
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl overflow-hidden">
      <CardHeader className="p-6">
        <CardTitle className="text-3xl font-bold text-primary">{product.name || 'Product Name Not Available'}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">Barcode: {product.id}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {product.imageUrl ? (
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-md">
            <Image
              src={product.imageUrl}
              alt={product.name || 'Product Image'}
              layout="fill"
              objectFit="contain"
              data-ai-hint="food product"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-64 md:h-80 bg-secondary rounded-lg shadow-md text-muted-foreground">
            <PackageOpen className="w-16 h-16 mb-4" />
            <p>No image available</p>
          </div>
        )}
        <IngredientHighlight ingredientsText={product.ingredientsText} />
      </CardContent>
    </Card>
  );
};

export default ProductDetails;
