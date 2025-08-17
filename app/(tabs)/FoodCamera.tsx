import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, ActivityIndicator, ScrollView, StyleSheet, Platform, Alert, TextStyle } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from "expo-image-picker";
import { searchFood } from "@/services/nutritionix";
import { supabase } from "@/services/supabase";
import { useAuth } from '@/contexts/AuthContext';
import { Theme } from '@/constants/Theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function FoodCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<React.ComponentRef<typeof CameraView> | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any[] | null>(null);
  const [queryText, setQueryText] = useState<string>("");
  const { user } = useAuth();

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const resetFormState = () => {
    setImage(null);
    setResult(null);
    setQueryText("");
    setLoading(false);
  };

  const analyzeImageWithClarifai = async (imageUri: string) => {
    try {
      setLoading(true);
      setResult(null);

      let base64: string;
      
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        const FileSystem = require('expo-file-system');
        base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
      
      const clarifaiResponse = await fetch('https://api.clarifai.com/v2/models/aaa03c23b3724a16a56b629203edc62c/outputs', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.EXPO_PUBLIC_CLARIFAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_app_id: {
            user_id: "clarifai",
            app_id: "main"
          },
          inputs: [{
            data: {
              image: {
                base64: base64
              }
            }
          }]
        })
      });

      if (!clarifaiResponse.ok) {
        const errorText = await clarifaiResponse.text();
        throw new Error(`Clarifai API ${clarifaiResponse.status}: ${errorText}`);
      }

      const clarifaiData = await clarifaiResponse.json();
      const concepts = clarifaiData.outputs[0]?.data?.concepts || [];
      
      const foodKeywords = [
        'food', 'fruit', 'vegetable', 'meat', 'bread', 'pasta', 'rice', 'pizza', 'burger', 'sandwich', 
        'apple', 'banana', 'chicken', 'beef', 'fish', 'salad', 'soup', 'cheese', 'egg', 'potato',
        'tomato', 'lettuce', 'carrot', 'broccoli', 'corn', 'bean', 'nut', 'berry', 'cake', 'cookie',
        'meal', 'dinner', 'lunch', 'breakfast', 'snack', 'dish', 'cuisine', 'beverage', 'drink'
      ];
      
      const foodLabels = concepts
        .filter((concept: any) => concept.value > 0.4)
        .map((concept: any) => concept.name.toLowerCase())
        .filter((name: string) => 
          foodKeywords.some(keyword => 
            name.includes(keyword) || keyword.includes(name)
          )
        )
        .slice(0, 3);

      if (foodLabels.length > 0) {
        const foodQuery = foodLabels.join(', ');
        
        const nutritionData = await searchFood(foodQuery);
        if (nutritionData.foods && nutritionData.foods.length > 0) {
          setResult(nutritionData.foods);
          await saveMealsToDatabase(nutritionData.foods, imageUri);
          
          Alert.alert('Success!', `Found and saved nutrition for: ${foodQuery}`);
          
          setTimeout(() => {
            resetFormState();
          }, 2000);
          
        } else {
          Alert.alert('Food Detected', `Found "${foodQuery}" but couldn't find nutrition data. Please enter manually.`);
          setQueryText(foodQuery);
        }
      } else {
        Alert.alert('No Food Detected', 'Please describe the food manually.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Analysis Failed', `${errorMessage}. Please describe the food manually.`);
    } finally {
      setLoading(false);
    }
  };

  const analyzeQuery = async () => {
    try {
      if (!queryText.trim()) {
        Alert.alert('Missing Information', "Enter a food description, e.g. '1 apple' or '2 eggs'");
        return;
      }

      setLoading(true);
      setResult(null);

      const data = await searchFood(queryText.trim());
      
      if (data.foods && data.foods.length > 0) {
        setResult(data.foods);
        await saveMealsToDatabase(data.foods);
        
        Alert.alert('Success!', `Found ${data.foods.length} food(s) and saved to database!`);
        
        setTimeout(() => {
          resetFormState();
        }, 2000);
        
      } else {
        Alert.alert('No Results', "No foods found for that query. Try something like '1 apple' or '2 eggs'");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', errorMessage.replace(/^Error:\s*/, "") || "Error recognizing food!");
    } finally {
      setLoading(false);
    }
  };

  const saveMealsToDatabase = async (foods: any[], imageUri?: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      for (const food of foods) {
        const mealData = {
          user_id: user.id,
          food_name: food.food_name,
          serving_qty: food.serving_qty || 1,
          serving_unit: food.serving_unit || 'serving',
          calories: Math.round(food.nf_calories || 0),
          protein: Math.round((food.nf_protein || 0) * 100) / 100,
          carbs: Math.round((food.nf_total_carbohydrate || 0) * 100) / 100,
          fat: Math.round((food.nf_total_fat || 0) * 100) / 100,
          fiber: Math.round((food.nf_dietary_fiber || 0) * 100) / 100,
          sugar: Math.round((food.nf_sugars || 0) * 100) / 100,
          sodium: Math.round((food.nf_sodium || 0) * 100) / 100,
          image_uri: imageUri || null,
          logged_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('meal_logs').insert(mealData);
        
        if (error) {
          console.error('Database error:', error);
          throw new Error(`Failed to save ${food.food_name}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      throw error;
    }
  };

  const takePicture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ base64: false });
      if (photo?.uri) {
        setImage(photo.uri);
        try {
          await analyzeImageWithClarifai(photo.uri);
        } catch (error) {
          console.log('Clarifai failed, using manual entry');
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        base64: false,
        quality: 0.7,
      });
      if (!pickerResult.canceled) {
        const asset = pickerResult.assets?.[0];
        if (asset?.uri) {
          setImage(asset.uri);
          try {
            await analyzeImageWithClarifai(asset.uri);
          } catch (error) {
            console.log('Clarifai failed, using manual entry');
          }
        }
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Card style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={64} color={Theme.colors.textMuted} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to help you log your meals
          </Text>
          <Button title="Grant Permission" onPress={requestPermission} />
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      {!image && (
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing="back" ref={cameraRef} />
          <View style={styles.cameraOverlay}>
            <View style={styles.focusFrame} />
          </View>
        </View>
      )}

      {/* Image Preview */}
      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.imagePreview} />
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <Button
          title="Take Photo"
          onPress={takePicture}
          variant="primary"
          style={styles.controlButton}
        />
        <Button
          title="Gallery"
          onPress={pickFromGallery}
          variant="outline"
          style={styles.controlButton}
        />
        {(image || result || queryText) && (
          <Button
            title="Reset"
            onPress={resetFormState}
            variant="ghost"
            style={styles.controlButton}
          />
        )}
      </View>

      {/* Manual Input */}
      <Card style={styles.inputCard}>
        <Input
          placeholder="Describe the food (e.g. '1 apple, 2 eggs')"
          value={queryText}
          onChangeText={setQueryText}
          leftIcon={<Ionicons name="restaurant-outline" size={20} color={Theme.colors.textMuted} />}
        />
        <Button
          title="Analyze Food"
          onPress={analyzeQuery}
          loading={loading}
          disabled={!queryText.trim()}
        />
      </Card>

      {/* Loading */}
      {loading && (
        <Card style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Analyzing nutrition...</Text>
        </Card>
      )}

      {/* Results */}
      {result && (
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.resultsTitle}>Nutrition Analysis</Text>
          {result.map((food: any, idx: number) => (
            <Card key={idx} style={styles.foodCard}>
              <Text style={styles.foodName}>{food.food_name}</Text>
              <Text style={styles.serving}>
                {food.serving_qty} {food.serving_unit}
              </Text>
              
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{Math.round(food.nf_calories || 0)}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{(food.nf_protein || 0).toFixed(1)}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{(food.nf_total_carbohydrate || 0).toFixed(1)}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{(food.nf_total_fat || 0).toFixed(1)}g</Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.background,
  },
  permissionCard: {
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  permissionTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.typography.h3.fontWeight,
    lineHeight: Theme.typography.h3.lineHeight,
    color: Theme.colors.text,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  permissionText: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: Theme.typography.body.fontWeight,
    lineHeight: Theme.typography.body.lineHeight,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: 'transparent',
  },
  imageContainer: {
    flex: 1,
  },
  imagePreview: {
    flex: 1,
    resizeMode: 'cover',
  },
  controls: {
    flexDirection: 'row',
    padding: Theme.spacing.md,
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  controlButton: {
    flex: 1,
  },
  inputCard: {
    margin: Theme.spacing.md,
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  loadingCard: {
    margin: Theme.spacing.md,
    padding: Theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: Theme.typography.body.fontWeight,
    lineHeight: Theme.typography.body.lineHeight,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.md,
  },
  resultsContainer: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  resultsTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.typography.h3.fontWeight,
    lineHeight: Theme.typography.h3.lineHeight,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  foodCard: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  foodName: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: Theme.typography.h3.fontWeight,
    lineHeight: Theme.typography.h3.lineHeight,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  serving: {
    fontSize: Theme.typography.bodySmall.fontSize,
    fontWeight: Theme.typography.bodySmall.fontWeight,
    lineHeight: Theme.typography.bodySmall.lineHeight,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.lg,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: Theme.typography.body.lineHeight,
    color: Theme.colors.text,
  },
  nutritionLabel: {
    fontSize: Theme.typography.caption.fontSize,
    fontWeight: Theme.typography.caption.fontWeight,
    lineHeight: Theme.typography.caption.lineHeight,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
});
