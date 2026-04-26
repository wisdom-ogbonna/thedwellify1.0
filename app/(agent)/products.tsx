import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
} from "react-native";
import { API } from "../../services/api";
import { useNavigation } from "@react-navigation/native";

export default function RentalProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation<any>();

  const fetchProducts = async () => {
    try {
      const res = await API.get("/products/get-rental-products");
      setProducts(res.data?.products || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, []);

  // ---------------- DELETE ----------------
  const handleDelete = (id: string) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await API.delete(`/products/delete-rental-product/${id}`);
            fetchProducts();
          } catch (err) {
            console.log(err);
          }
        },
      },
    ]);
  };

  // ---------------- ITEM ----------------
  const renderItem = ({ item }: any) => {
    const image = item.images?.[0];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("ProductDetails", { id: item.id })
        }
      >
        <Image source={{ uri: image }} style={styles.image} />

        <View style={styles.body}>
          <Text style={styles.title}>{item.title}</Text>

          <Text style={styles.price}>
            ₦{Number(item.price).toLocaleString()}
          </Text>

          <Text style={styles.location}>{item.location}</Text>

          <Text style={styles.type}>{item.propertyType}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() =>
                navigation.navigate("ProductDetails", { id: item.id })
              }
            >
              <Text style={styles.btnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={styles.btnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
  },

  image: { width: "100%", height: 150 },

  body: { padding: 12 },

  title: { fontSize: 16, fontWeight: "600" },
  price: { color: "#3B82F6", fontWeight: "bold" },
  location: { color: "#777", fontSize: 12 },
  type: { marginTop: 4, fontSize: 12 },

  actions: { flexDirection: "row", marginTop: 10 },

  editBtn: {
    backgroundColor: "#3B82F6",
    padding: 8,
    borderRadius: 6,
    marginRight: 10,
  },

  deleteBtn: {
    backgroundColor: "red",
    padding: 8,
    borderRadius: 6,
  },

  btnText: { color: "#fff" },
});