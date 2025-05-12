"use client";

import type React from 'react';
import { NON_VEGAN_INGREDIENTS } from '@/lib/nonVeganIngredients';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Leaf } from 'lucide-react';

interface IngredientHighlightProps {
  ingredientsText?: string;
}

interface ParsedIngredient {
  text: string;
  isNonVegan: boolean;
  originalText: string;
}

const IngredientHighlight: React.FC<IngredientHighlightProps> = ({ ingredientsText }) => {
  if (!ingredientsText) {
    return <p className="text-muted-foreground">No ingredient information available.</p>;
  }

  // Basic parsing: split by common delimiters, handle some parenthetical cases crudely.
  // A more robust parser would be needed for complex ingredient lists.
  const cleanedText = ingredientsText
    .replace(/ingredients:/i, '')
    .replace(/contains:/i, '')
    .replace(/may contain:/i, '')
    .replace(/allergens:/i, '');
  
  const potentialIngredients = cleanedText
    .split(/[,;.]|\([^)]*\)/g) // Split by comma, semicolon, period, or content within parentheses
    .map(part => part.trim())
    .filter(part => part.length > 0);
  
  // Add back parenthetical content as separate "ingredients" for checking, but link to original full string
  const fullIngredientSegments: string[] = [];
  let lastIndex = 0;
  cleanedText.replace(/[^,;.]+/g, (match, offset) => {
    fullIngredientSegments.push(match.trim());
    return match;
  });


  const parsedIngredients: ParsedIngredient[] = fullIngredientSegments.map(segment => {
    const lowerSegment = segment.toLowerCase();
    let isNonVegan = false;
    for (const nonVeganKeyword of NON_VEGAN_INGREDIENTS) {
      // Use word boundary regex to avoid partial matches (e.g., "corn" in "popcorn")
      const regex = new RegExp(`\\b${nonVeganKeyword}\\b`, 'i');
      if (regex.test(lowerSegment)) {
        isNonVegan = true;
        break;
      }
    }
    return { text: lowerSegment, isNonVegan, originalText: segment };
  });

  const hasNonVegan = parsedIngredients.some(ing => ing.isNonVegan);

  return (
    <div className="space-y-3">
      <h3 className="text-xl font-semibold text-foreground mb-2">Ingredients:</h3>
      {hasNonVegan ? (
        <Badge variant="destructive" className="mb-3 text-base px-3 py-1.5">
          <AlertTriangle className="mr-2 h-5 w-5" /> Contains Potentially Non-Vegan Ingredients
        </Badge>
      ) : (
        <Badge variant="default" className="mb-3 bg-primary hover:bg-primary/90 text-base px-3 py-1.5">
           <Leaf className="mr-2 h-5 w-5" /> Appears Vegan-Friendly (based on listed ingredients)
        </Badge>
      )}
      <div className="text-sm text-foreground leading-relaxed space-x-1">
        {parsedIngredients.map((ingredient, index) => (
          <span key={index}>
            {ingredient.isNonVegan ? (
              <mark className="bg-accent text-accent-foreground px-1 py-0.5 rounded font-medium" title={`Potential non-vegan: ${ingredient.originalText}`}>
                {ingredient.originalText}
              </mark>
            ) : (
              <span>{ingredient.originalText}</span>
            )}
            {index < parsedIngredients.length - 1 && <span className="text-muted-foreground">, </span>}
          </span>
        ))}
        {parsedIngredients.length === 0 && <p className="text-muted-foreground">Could not parse ingredients.</p>}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Disclaimer: Ingredient analysis is automated and may not be 100% accurate. Always double-check product labels.
      </p>
    </div>
  );
};

export default IngredientHighlight;
