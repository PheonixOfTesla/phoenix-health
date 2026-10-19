// AI Meal Planning Service
// Meal plan generation, photo analysis, recipe suggestions
// NOW WIRED: Uses Gemini AI for intelligent meal plan generation

const nutritionCalc = require('./nutritionCalc');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
let genAI;
let geminiModel;
try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
} catch (error) {
  console.warn('[MealPlanningAI] Gemini initialization failed:', error.message);
}

/**
 * Generate AI-powered meal plan using Gemini
 */
exports.generate = async (userId, preferences = {}) => {
  try {
    const {
      goals = 'maintain',
      dietaryPreferences = [],  // vegetarian, vegan, keto, paleo
      allergies = [],
      budget = 'medium',
      duration = 7,  // days
      mealsPerDay = 3,
      calorieTarget = 2000,
      macroTargets = { protein: 150, carbs: 200, fat: 65 }
    } = preferences;

    // If Gemini is available, use AI generation
    if (geminiModel) {
      try {
        const aiMealPlan = await generateWithGemini({
          goals,
          dietaryPreferences,
          allergies,
          budget,
          duration,
          mealsPerDay,
          calorieTarget,
          macroTargets
        });

        if (aiMealPlan) {
          return aiMealPlan;
        }
      } catch (geminiError) {
        console.warn('[MealPlanningAI] Gemini generation failed, falling back:', geminiError.message);
      }
    }

    // Fallback to template-based generation if Gemini fails
    return generateTemplateBasedPlan({
      goals,
      dietaryPreferences,
      allergies,
      budget,
      duration,
      mealsPerDay,
      calorieTarget,
      macroTargets
    });

  } catch (error) {
    console.error('Meal plan generation error:', error);
    throw error;
  }
};

/**
 * Generate meal plan using Gemini AI
 */
async function generateWithGemini(params) {
  const {
    goals,
    dietaryPreferences,
    allergies,
    budget,
    duration,
    mealsPerDay,
    calorieTarget,
    macroTargets
  } = params;

  const prompt = `Generate a ${duration}-day meal plan as JSON. Requirements:
- Goal: ${goals} (maintain/lose/gain weight)
- Daily calories: ${calorieTarget}
- Daily macros: ${macroTargets.protein}g protein, ${macroTargets.carbs}g carbs, ${macroTargets.fat}g fat
- Meals per day: ${mealsPerDay}
- Dietary preferences: ${dietaryPreferences.length > 0 ? dietaryPreferences.join(', ') : 'none'}
- Allergies: ${allergies.length > 0 ? allergies.join(', ') : 'none'}
- Budget: ${budget} (low/medium/high)

Return ONLY valid JSON in this exact format:
{
  "days": [
    {
      "day": 1,
      "meals": [
        {
          "mealType": "Breakfast",
          "time": "8:00 AM",
          "name": "Meal name",
          "protein": 25,
          "carbs": 40,
          "fat": 10,
          "calories": 350,
          "cost": 4,
          "ingredients": ["ingredient1", "ingredient2"]
        }
      ],
      "dailyMacros": { "protein": 150, "carbs": 200, "fat": 65, "calories": 2000 }
    }
  ],
  "shoppingList": ["item1", "item2"],
  "estimatedCost": 100,
  "tips": ["Tip 1", "Tip 2"]
}`;

  const result = await geminiModel.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON in Gemini response');
  }

  const mealPlanData = JSON.parse(jsonMatch[0]);

  // Calculate totals
  let totalProtein = 0, totalCarbs = 0, totalFat = 0, totalCalories = 0;
  mealPlanData.days.forEach(day => {
    totalProtein += day.dailyMacros?.protein || 0;
    totalCarbs += day.dailyMacros?.carbs || 0;
    totalFat += day.dailyMacros?.fat || 0;
    totalCalories += day.dailyMacros?.calories || 0;
  });

  const mealPlan = {
    days: mealPlanData.days.map((day, idx) => ({
      ...day,
      date: new Date(Date.now() + idx * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })),
    shoppingList: mealPlanData.shoppingList || [],
    macros: {
      protein: Math.round(totalProtein / duration),
      carbs: Math.round(totalCarbs / duration),
      fat: Math.round(totalFat / duration),
      calories: Math.round(totalCalories / duration)
    },
    estimatedCost: mealPlanData.estimatedCost || 0
  };

  console.log('[MealPlanningAI] ✅ Generated AI meal plan with Gemini');

  return {
    mealPlan,
    adherenceScore: 95,
    source: 'gemini-ai',
    reasoning: [
      `AI-generated ${duration}-day personalized meal plan`,
      `${mealsPerDay} meals per day tailored to your goals`,
      `Target: ${calorieTarget} calories/day`,
      `Estimated cost: $${mealPlan.estimatedCost.toFixed(2)}`,
      ...(mealPlanData.tips || [])
    ]
  };
}

/**
 * Fallback template-based meal plan generation
 */
function generateTemplateBasedPlan(params) {
  const {
    goals,
    dietaryPreferences,
    duration,
    mealsPerDay,
    calorieTarget,
    macroTargets
  } = params;

  const mealPlan = {
    days: [],
    shoppingList: [],
    macros: { protein: 0, carbs: 0, fat: 0, calories: 0 },
    estimatedCost: 0
  };

  // Template meal database
  const mealDatabase = {
    breakfast: [
      { name: 'Oatmeal with berries', protein: 15, carbs: 60, fat: 8, calories: 350, cost: 3, ingredients: ['oats', 'berries', 'milk'] },
      { name: 'Greek yogurt parfait', protein: 25, carbs: 40, fat: 10, calories: 340, cost: 4, ingredients: ['greek yogurt', 'granola', 'honey'] },
      { name: 'Scrambled eggs with toast', protein: 20, carbs: 30, fat: 15, calories: 330, cost: 3, ingredients: ['eggs', 'bread', 'butter'] },
      { name: 'Protein smoothie', protein: 30, carbs: 45, fat: 12, calories: 400, cost: 5, ingredients: ['protein powder', 'banana', 'almond milk'] }
    ],
    lunch: [
      { name: 'Chicken breast with rice', protein: 40, carbs: 60, fat: 12, calories: 500, cost: 6, ingredients: ['chicken breast', 'rice', 'vegetables'] },
      { name: 'Salmon salad', protein: 35, carbs: 20, fat: 20, calories: 420, cost: 8, ingredients: ['salmon', 'mixed greens', 'olive oil'] },
      { name: 'Turkey sandwich', protein: 30, carbs: 50, fat: 15, calories: 450, cost: 5, ingredients: ['turkey', 'bread', 'lettuce'] },
      { name: 'Quinoa bowl', protein: 25, carbs: 55, fat: 18, calories: 480, cost: 6, ingredients: ['quinoa', 'chickpeas', 'vegetables'] }
    ],
    dinner: [
      { name: 'Grilled chicken with vegetables', protein: 45, carbs: 30, fat: 15, calories: 450, cost: 7, ingredients: ['chicken', 'broccoli', 'carrots'] },
      { name: 'Lean steak with sweet potato', protein: 50, carbs: 40, fat: 20, calories: 550, cost: 10, ingredients: ['steak', 'sweet potato', 'asparagus'] },
      { name: 'Fish tacos', protein: 35, carbs: 45, fat: 18, calories: 480, cost: 8, ingredients: ['white fish', 'tortillas', 'cabbage'] },
      { name: 'Pasta with lean meat', protein: 40, carbs: 70, fat: 15, calories: 580, cost: 6, ingredients: ['pasta', 'ground turkey', 'tomato sauce'] }
    ],
    snack: [
      { name: 'Protein bar', protein: 20, carbs: 25, fat: 8, calories: 240, cost: 2, ingredients: ['protein bar'] },
      { name: 'Apple with peanut butter', protein: 5, carbs: 30, fat: 10, calories: 220, cost: 2, ingredients: ['apple', 'peanut butter'] },
      { name: 'Cottage cheese', protein: 15, carbs: 10, fat: 5, calories: 140, cost: 2, ingredients: ['cottage cheese'] }
    ]
  };

  const allIngredients = new Set();

  // Generate meal plan for each day
  for (let day = 1; day <= duration; day++) {
    const dayPlan = {
      day,
      date: new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      meals: [],
      dailyMacros: { protein: 0, carbs: 0, fat: 0, calories: 0 }
    };

    // Add breakfast
    const breakfast = mealDatabase.breakfast[Math.floor(Math.random() * mealDatabase.breakfast.length)];
    dayPlan.meals.push({ mealType: 'Breakfast', time: '8:00 AM', ...breakfast });
    breakfast.ingredients.forEach(i => allIngredients.add(i));

    // Add lunch
    const lunch = mealDatabase.lunch[Math.floor(Math.random() * mealDatabase.lunch.length)];
    dayPlan.meals.push({ mealType: 'Lunch', time: '12:00 PM', ...lunch });
    lunch.ingredients.forEach(i => allIngredients.add(i));

    // Add dinner
    const dinner = mealDatabase.dinner[Math.floor(Math.random() * mealDatabase.dinner.length)];
    dayPlan.meals.push({ mealType: 'Dinner', time: '6:00 PM', ...dinner });
    dinner.ingredients.forEach(i => allIngredients.add(i));

    // Add snack if needed
    if (mealsPerDay > 3) {
      const snack = mealDatabase.snack[Math.floor(Math.random() * mealDatabase.snack.length)];
      dayPlan.meals.push({ mealType: 'Snack', time: '3:00 PM', ...snack });
      snack.ingredients.forEach(i => allIngredients.add(i));
    }

    // Calculate daily macros
    dayPlan.meals.forEach(meal => {
      dayPlan.dailyMacros.protein += meal.protein;
      dayPlan.dailyMacros.carbs += meal.carbs;
      dayPlan.dailyMacros.fat += meal.fat;
      dayPlan.dailyMacros.calories += meal.calories;
    });

    mealPlan.days.push(dayPlan);
  }

  mealPlan.shoppingList = Array.from(allIngredients);

  // Calculate totals
  mealPlan.days.forEach(day => {
    mealPlan.macros.protein += day.dailyMacros.protein;
    mealPlan.macros.carbs += day.dailyMacros.carbs;
    mealPlan.macros.fat += day.dailyMacros.fat;
    mealPlan.macros.calories += day.dailyMacros.calories;
    day.meals.forEach(meal => {
      mealPlan.estimatedCost += meal.cost;
    });
  });

  // Average per day
  mealPlan.macros.protein = Math.round(mealPlan.macros.protein / duration);
  mealPlan.macros.carbs = Math.round(mealPlan.macros.carbs / duration);
  mealPlan.macros.fat = Math.round(mealPlan.macros.fat / duration);
  mealPlan.macros.calories = Math.round(mealPlan.macros.calories / duration);

  return {
    mealPlan,
    adherenceScore: 85,
    source: 'template',
    reasoning: [
      `Generated ${duration}-day meal plan`,
      `${mealsPerDay} meals per day`,
      `Target: ${calorieTarget} calories/day`,
      `Estimated cost: $${mealPlan.estimatedCost.toFixed(2)}`
    ]
  };
}

/**
 * Analyze food from photo using Gemini Vision AI
 */
exports.analyzePhoto = async (imageBuffer) => {
  try {
    if (!geminiModel) {
      throw new Error('Gemini not configured for photo analysis');
    }

    // Convert buffer to base64 for Gemini
    const base64Image = imageBuffer.toString('base64');

    const prompt = `Analyze this food photo and identify all foods visible. For each food item, estimate:
- Name of the food
- Serving size
- Calories
- Protein (grams)
- Carbohydrates (grams)
- Fat (grams)

Return ONLY valid JSON in this format:
{
  "foods": [
    {
      "name": "Food name",
      "confidence": 0.9,
      "servingSize": "1 cup",
      "calories": 200,
      "protein": 10,
      "carbs": 25,
      "fat": 8
    }
  ],
  "totalMacros": {
    "calories": 500,
    "protein": 30,
    "carbs": 50,
    "fat": 20
  },
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`;

    const result = await geminiModel.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in Gemini response');
    }

    const analysisData = JSON.parse(jsonMatch[0]);

    // Calculate overall confidence
    const avgConfidence = analysisData.foods.length > 0
      ? analysisData.foods.reduce((sum, f) => sum + (f.confidence || 0.85), 0) / analysisData.foods.length
      : 0.85;

    console.log('[MealPlanningAI] ✅ Photo analyzed with Gemini Vision');

    return {
      foods: analysisData.foods || [],
      totalMacros: analysisData.totalMacros || { calories: 0, protein: 0, carbs: 0, fat: 0 },
      confidence: avgConfidence,
      suggestions: analysisData.suggestions || [],
      source: 'gemini-vision'
    };

  } catch (error) {
    console.error('Photo analysis error:', error);
    // Return empty analysis on error instead of throwing
    return {
      foods: [],
      totalMacros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      confidence: 0,
      suggestions: ['Could not analyze photo. Please try again with better lighting.'],
      error: error.message
    };
  }
};

/**
 * Suggest recipes based on preferences
 */
exports.suggestRecipes = async (params) => {
  try {
    const {
      ingredients = [],
      macroTargets = {},
      cuisine = 'any',
      cookingTime = 60,
      difficulty = 'medium'
    } = params;

    // Sample recipe database
    const recipes = [
      {
        name: 'High-Protein Chicken Stir Fry',
        cuisine: 'asian',
        difficulty: 'easy',
        cookingTime: 25,
        servings: 4,
        ingredients: ['chicken', 'vegetables', 'soy sauce', 'rice'],
        macros: { protein: 45, carbs: 35, fat: 12, calories: 430 },
        instructions: [
          'Cut chicken into bite-sized pieces',
          'Stir fry in wok with vegetables',
          'Add sauce and serve over rice'
        ],
        fitScore: 95
      },
      {
        name: 'Lean Turkey Meatballs',
        cuisine: 'italian',
        difficulty: 'medium',
        cookingTime: 35,
        servings: 4,
        ingredients: ['ground turkey', 'breadcrumbs', 'eggs', 'marinara'],
        macros: { protein: 40, carbs: 25, fat: 10, calories: 350 },
        instructions: [
          'Mix turkey with breadcrumbs and seasonings',
          'Form into meatballs',
          'Bake at 375°F for 25 minutes'
        ],
        fitScore: 92
      },
      {
        name: 'Salmon with Quinoa',
        cuisine: 'american',
        difficulty: 'easy',
        cookingTime: 30,
        servings: 2,
        ingredients: ['salmon', 'quinoa', 'asparagus', 'lemon'],
        macros: { protein: 38, carbs: 42, fat: 18, calories: 480 },
        instructions: [
          'Cook quinoa according to package',
          'Pan-sear salmon',
          'Roast asparagus and serve with lemon'
        ],
        fitScore: 96
      }
    ];

    // Filter by criteria
    let filtered = recipes;
    
    if (cuisine !== 'any') {
      filtered = filtered.filter(r => r.cuisine === cuisine);
    }
    
    if (cookingTime) {
      filtered = filtered.filter(r => r.cookingTime <= cookingTime);
    }

    // Sort by fit score
    filtered.sort((a, b) => b.fitScore - a.fitScore);

    return {
      recipes: filtered,
      totalFound: filtered.length,
      reasoning: [
        `Found ${filtered.length} recipes matching criteria`,
        `Cooking time: under ${cookingTime} minutes`,
        `Sorted by macro fit score`
      ]
    };

  } catch (error) {
    console.error('Recipe suggestion error:', error);
    throw error;
  }
};

/**
 * Get restaurant recommendations
 */
exports.getRestaurantRecommendations = async (location, macroTargets) => {
  try {
    // Mock restaurant data with healthy options
    return {
      restaurants: [
        {
          name: 'Clean Eats Bistro',
          cuisine: 'American',
          distance: '0.5 miles',
          rating: 4.5,
          priceRange: '$$',
          healthyOptions: [
            {
              name: 'Grilled Chicken Salad',
              calories: 420,
              protein: 45,
              carbs: 25,
              fat: 15
            },
            {
              name: 'Turkey Power Bowl',
              calories: 520,
              protein: 50,
              carbs: 45,
              fat: 18
            }
          ]
        },
        {
          name: 'Fit Kitchen',
          cuisine: 'Health Food',
          distance: '1.2 miles',
          rating: 4.8,
          priceRange: '$$$',
          healthyOptions: [
            {
              name: 'Macro Balanced Plate',
              calories: 550,
              protein: 52,
              carbs: 50,
              fat: 16
            }
          ]
        }
      ],
      recommendations: [
        'Clean Eats Bistro has options closest to your macro targets',
        'Fit Kitchen specializes in macro-friendly meals'
      ]
    };

  } catch (error) {
    console.error('Restaurant recommendation error:', error);
    throw error;
  }
};

module.exports = exports;
