"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import ProductDetails from '@/components/product/ProductDetails';
import type { ProductData, ProcessedProduct } from '@/types/product';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Info, XCircle } from 'lucide-react';

export default function HomePage() {
  const [product, setProduct] = useState<ProcessedProduct | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchProductData = async (barcode: string) => {
    setIsLoading(true);
    setError(null);
    setProduct(null); // Clear previous product

    try {
      // Using Open Food Facts API v2
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_en,image_front_url,image_url,selected_images,ingredients_text,ingredients_text_en,ingredients_text_with_allergens,ingredients_text_with_allergens_en`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ProductData = await response.json();

      if (data.status === 1 && data.product) {
        const p = data.product;
        const processed: ProcessedProduct = {
          id: data.code,
          name: p.product_name_en || p.product_name || 'Unknown Product',
          imageUrl: p.image_front_url || p.image_url || p.selected_images?.front?.display_url || `https://picsum.photos/400/300?random=${barcode}`,
          ingredientsText: p.ingredients_text_en || p.ingredients_text || p.ingredients_text_with_allergens_en || p.ingredients_text_with_allergens || undefined,
        };
        setProduct(processed);
        toast({
          title: "Product Found!",
          description: `Displaying information for ${processed.name}.`,
        });
      } else {
        setError(`Product with barcode ${barcode} not found or has no data. Status: ${data.status_verbose}`);
        toast({
          title: "Product Not Found",
          description: `Could not find information for barcode ${barcode}.`,
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to fetch product data: ${errorMessage}`);
      toast({
        title: "API Error",
        description: "There was a problem fetching product information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeScanned = (barcode: string) => {
    setIsScanning(false); // Ensure scanning UI stops
    fetchProductData(barcode);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="space-y-10">
          {!product && !isLoading && ( // Show scanner only if no product is displayed and not loading
            <BarcodeScanner 
              onBarcodeScanned={handleBarcodeScanned} 
              isScanning={isScanning}
              setIsScanning={setIsScanning}
              isLoading={isLoading}
            />
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-10 bg-card rounded-xl shadow-xl">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-xl font-semibold text-foreground">Fetching product data...</p>
              <p className="text-muted-foreground">Please wait a moment.</p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive" className="max-w-md mx-auto shadow-lg">
              <XCircle className="h-5 w-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {product && !isLoading && (
            <ProductDetails product={product} />
          )}

          {!product && !isLoading && !error && !isScanning && (
             <div className="text-center p-10 bg-card rounded-xl shadow-xl max-w-md mx-auto">
                <Info className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome to VeganWise!</h2>
                <p className="text-muted-foreground">
                  Scan a product's barcode or enter it manually to check its ingredients.
                </p>
              </div>
          )}
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border mt-auto">
        © {new Date().getFullYear()} VeganWise. All rights reserved.
      </footer>
    </div>
  );
}
