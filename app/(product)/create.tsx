// import { useTheme } from "@/hooks/use-theme";
// import { ResizeMode, Video } from "expo-av";
// import * as ImagePicker from "expo-image-picker";
// import { useRouter } from "expo-router";
// import {
//   CloudArrowUp,
//   Image as ImageIcon,
//   VideoCamera,
//   X,
// } from "phosphor-react-native";
// import React, { useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Image,
//   TouchableOpacity,
//   ScrollView,
//   Text,
//   TextInput,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { API } from "../../services/api";

// const TYPES = ["Apartment", "Hotel", "Shortlet"];
// const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB

// export default function CreateProduct() {
//   const router = useRouter();
//   const { colors } = useTheme();

//   const [title, setTitle] = useState("");
//   const [price, setPrice] = useState("");
//   const [location, setLocation] = useState("");
//   const [description, setDescription] = useState("");
//   const [propertyType, setPropertyType] = useState("");

//   const [images, setImages] = useState<any[]>([]);
//   const [video, setVideo] = useState<any | null>(null);

//   const [loading, setLoading] = useState(false);
//   const [progress, setProgress] = useState(0);

//   /**
//    * 📸 PICK IMAGES
//    */
//   const pickImages = async () => {
//     const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

//     if (!permission.granted) {
//       Alert.alert("Permission required");
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsMultipleSelection: true,
//       quality: 0.4,
//     });

//     if (!result.canceled) {
//       setImages(result.assets);
//     }
//   };

//   /**
//    * 🎥 PICK VIDEO (FIXED)
//    */
//   const pickVideo = async () => {
//     const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

//     if (!permission.granted) {
//       Alert.alert("Permission required");
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Videos, // ✅ FIXED
//       allowsEditing: false,
//       quality: 1,
//     });

//     if (result.canceled) return;

//     const file = result.assets[0];

//     // 🔥 Get file size safely
//     const fileSize = (file as any).fileSize || (file as any).size;

//     if (!fileSize) {
//       Alert.alert("Error", "Cannot read video size");
//       return;
//     }

//     // ❌ Validate size BEFORE upload
//     if (fileSize > MAX_VIDEO_SIZE) {
//       Alert.alert(
//         "Video too large",
//         "Video must be 15MB or less. Please compress or choose another video.",
//       );
//       return;
//     }

//     // ❌ Validate format
//     if (!file.uri.endsWith(".mp4")) {
//       Alert.alert("Invalid format", "Only MP4 videos are allowed");
//       return;
//     }

//     setVideo(file);
//   };

//   const removeImage = (index: number) => {
//     setImages((prev) => prev.filter((_, i) => i !== index));
//   };

//   const removeVideo = () => setVideo(null);

//   /**
//    * 🚀 SUBMIT
//    */
//   const handleSubmit = async () => {
//     if (
//       !title ||
//       !price ||
//       !location ||
//       !propertyType ||
//       !description ||
//       images.length === 0 ||
//       !video
//     ) {
//       Alert.alert("Error", "All fields are required");
//       return;
//     }

//     if (images.length === 0) {
//       Alert.alert("Error", "Please add at least one image");
//       return;
//     }

//     try {
//       setLoading(true);
//       setProgress(0);

//       const formData = new FormData();

//       formData.append("title", title);
//       formData.append("price", price);
//       formData.append("location", location);
//       formData.append("propertyType", propertyType);
//       formData.append("description", description);

//       // IMAGES
//       images.forEach((img, index) => {
//         formData.append("images", {
//           uri: img.uri,
//           name: `image_${index}.jpg`,
//           type: "image/jpeg",
//         } as any);
//       });

//       // VIDEO
//       if (video) {
//         formData.append("video", {
//           uri: video.uri,
//           name: "video.mp4",
//           type: "video/mp4",
//         } as any);
//       }

//       await API.post("/products/add-rental-product", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//         onUploadProgress: (event) => {
//           const percent = Math.round((event.loaded * 100) / (event.total || 1));
//           setProgress(percent);
//         },
//       });

//       Alert.alert("Success", "Listing created successfully");
//       router.push("/(product)/products");
//     } catch (err: any) {
//       console.log(err?.response?.data || err.message);
//       Alert.alert("Error", "Failed to create listing");
//     } finally {
//       setLoading(false);
//       setProgress(0);
//     }
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
//       <ScrollView className="px-6 py-4">
//         {/* HEADER */}
//         <View className="flex-row justify-between items-center mb-6">
//           <Text className="text-3xl font-black" style={{ color: colors.text }}>
//             Create Listing
//           </Text>

//           <TouchableOpacity onPress={() => router.back()}>
//             <X size={22} color={colors.text} />
//           </TouchableOpacity>
//         </View>

//         {/* INPUTS */}
//         <TextInput
//           placeholder="Title"
//           value={title}
//           onChangeText={setTitle}
//           className="border p-4 rounded-xl mb-3"
//           style={{ borderColor: colors.border, color: colors.text }}
//         />

//         <TextInput
//           placeholder="Location"
//           value={location}
//           onChangeText={setLocation}
//           className="border p-4 rounded-xl mb-3"
//           style={{ borderColor: colors.border, color: colors.text }}
//         />

//         <TextInput
//           placeholder="Price"
//           value={price}
//           onChangeText={setPrice}
//           keyboardType="numeric"
//           className="border p-4 rounded-xl mb-3"
//           style={{ borderColor: colors.border, color: colors.text }}
//         />

//         <TextInput
//           placeholder="Description"
//           value={description}
//           onChangeText={setDescription}
//           multiline
//           className="border p-4 rounded-xl mb-4"
//           style={{ borderColor: colors.border, color: colors.text }}
//         />

//         {/* PROPERTY TYPE */}
//         <View className="flex-row gap-2 mb-4">
//           {TYPES.map((type) => (
//             <TouchableOpacity
//               key={type}
//               onPress={() => setPropertyType(type)}
//               className="px-4 py-2 rounded-lg border"
//               style={{
//                 backgroundColor:
//                   propertyType === type ? colors.text : "transparent",
//                 borderColor: colors.border,
//               }}
//             >
//               <Text
//                 style={{
//                   color:
//                     propertyType === type ? colors.background : colors.text,
//                 }}
//               >
//                 {type}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* IMAGE PICKER */}
//         <TouchableOpacity
//           onPress={pickImages}
//           className="p-6 border-dashed border rounded-xl items-center mb-4"
//         >
//           <ImageIcon size={30} color={colors.text} />
//           <Text style={{ color: colors.text }}>Add Images</Text>
//         </TouchableOpacity>

//         {/* VIDEO PICKER (FIXED) */}
//         <TouchableOpacity
//           onPress={pickVideo}
//           className="p-6 border-dashed border rounded-xl items-center mb-4"
//         >
//           <VideoCamera size={30} color={colors.text} />
//           <Text style={{ color: colors.text }}>Add Video (MP4, max 15MB)</Text>
//         </TouchableOpacity>

//         {/* IMAGE PREVIEW */}
//         <ScrollView horizontal className="mb-4">
//           {images.map((img, i) => (
//             <View key={i} className="mr-2 relative">
//               <Image
//                 source={{ uri: img.uri }}
//                 className="w-24 h-24 rounded-xl"
//               />
//               <TouchableOpacity
//                 onPress={() => removeImage(i)}
//                 className="absolute top-1 right-1 bg-black/70 p-1 rounded-full"
//               >
//                 <X size={12} color="#fff" />
//               </TouchableOpacity>
//             </View>
//           ))}
//         </ScrollView>

//         {/* VIDEO PREVIEW */}
//         {video && (
//           <View className="mb-4 relative">
//             <Video
//               source={{ uri: video.uri }}
//               style={{ width: "100%", height: 200, borderRadius: 12 }}
//               useNativeControls
//               resizeMode={ResizeMode.COVER}
//             />
//             <TouchableOpacity
//               onPress={removeVideo}
//               className="absolute top-2 right-2 bg-black/70 p-2 rounded-full"
//             >
//               <X size={14} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* PROGRESS */}
//         {loading && (
//           <View className="flex-row items-center mb-4">
//             <ActivityIndicator color={colors.text} />
//             <Text style={{ marginLeft: 10, color: colors.text }}>
//               Uploading... {progress}%
//             </Text>
//           </View>
//         )}

//         {/* SUBMIT */}
//         <TouchableOpacity
//           onPress={handleSubmit}
//           className="p-5 rounded-xl items-center"
//           style={{ backgroundColor: colors.text }}
//         >
//           <View className="flex-row items-center">
//             <CloudArrowUp size={20} color={colors.background} />
//             <Text style={{ color: colors.background, marginLeft: 8 }}>
//               Create Listing
//             </Text>
//           </View>
//         </TouchableOpacity>

//         <View className="h-20" />
//       </ScrollView>
//     </SafeAreaView>
//   );
// }


// app/(agent)/create-property.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInRight } from "react-native-reanimated";
import {
  X,
  ChevronDown,
  MapPin,
  Search,
  Plus,
  Video,
  CheckCircle2,
  Share2,
  MessageSquare,
  Sliders,
  ArrowLeft,
  Check,
  ChevronRight
} from "lucide-react-native";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const INITIAL_PHOTOS = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500",
  "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=500",
  "https://images.unsplash.com/photo-160056672355-35792bedcfea?w=500",
];

const ALL_PROPERTY_TYPES = [
  "Apartment",
  "Hotel",
  "Shortlet",
  "House",
  "Land",
];

export default function CreateListingMultiStep() {
  const [step, setStep] = useState(1);

  // --- Step 1 Form States ---
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("Apartment");
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
  const [purpose, setPurpose] = useState("Sale");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");

  // --- Step 2 Media States ---
  const [photos, setPhotos] = useState(INITIAL_PHOTOS);

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // --- Dynamic Filtering Logic for Property Types ---
  const getFilteredPropertyTypes = () => {
    if (purpose === "Rent") {
      return ALL_PROPERTY_TYPES.filter((type) => type !== "Land");
    }
    return ALL_PROPERTY_TYPES;
  };

  const handlePurposeChange = (selectedPurpose: "Sale" | "Rent") => {
    setPurpose(selectedPurpose);
    // Force switch type if land was selected but user changed to Rent
    if (selectedPurpose === "Rent" && propertyType === "Land") {
      setPropertyType("Apartment");
    }
  };

  // --- Validation Logic ---
  const isStep1Valid =
    title.trim().length > 3 &&
    price.trim().length > 0 &&
    address.trim().length > 3;
  const isStep2Valid = photos.length > 0;

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "bottom"]}
      style={{ backgroundColor: "white", flex: 1 }}
    >
      {/* Top Header Navigation bar */}
      {step < 3 && (
        <View className="flex-row items-center justify-between px-6 py-3 border-b border-slate-100">
          <Pressable
            onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
          >
            {step === 1 ? (
              <X size={22} color="#1E293B" />
            ) : (
              <ArrowLeft size={22} color="#1E293B" />
            )}
          </Pressable>
          <Text className="text-base font-semibold text-slate-800 font-['Inter']">
            Add New Listing
          </Text>
          <Pressable>
            <Text className="text-slate-400 font-medium text-md font-['Inter']">
              Draft saved
            </Text>
          </Pressable>
        </View>
      )}

      {/* --- STEP 1: BASIC DETAILS --- */}
      {step === 1 && (
        <Animated.View entering={FadeIn} className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="px-6 py-4"
            keyboardShouldPersistTaps="handled"
          >
            {/* Step Sub-Header Indicator */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row space-x-1 items-center flex-1 mr-4">
                <View className="h-1 bg-[#0A65FF] rounded-full flex-1" />
                <View className="h-1 bg-slate-100 rounded-full flex-1" />
                <View className="h-1 bg-slate-100 rounded-full flex-1" />
                <View className="h-1 bg-slate-100 rounded-full flex-1" />
              </View>
              <Text className="text-md font-semibold text-slate-400 font-['Inter']">
                Step 1 of 4
              </Text>
            </View>

            <Text className="text-2xl font-bold text-slate-900 font-['Poppins'] mb-2">
              List your sanctuary.
            </Text>
            <Text className="text-slate-500 font-['Inter'] text-md leading-5 mb-6">
              Provide the fundamental details of your exclusive property to
              begin the curation process.
            </Text>

            {/* Inputs */}
            <View className="space-y-5 gap-5">
              {/* Property Title */}
              <View>
                <Text className="text-slate-700 font-semibold mb-2 text-md font-['Inter']">
                  Property Title
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., The Azure Heights Penthouse"
                  placeholderTextColor="#94A3B8"
                  className="w-full border border-slate-200 rounded-2xl bg-slate-50/50 px-6 h-14 text-slate-800 py-1 text-base font-['Inter']"
                />
              </View>

              {/* Type and Purpose Row */}
              <View className="flex-row space-x-4 gap-2">
                {/* SELECTABLE PROPERTY TYPE CONTAINER */}
                <View className="flex-1">
                  <Text className="text-slate-700 font-semibold mb-2 text-md font-['Inter']">
                    Type
                  </Text>
                  <Pressable
                    onPress={() => setIsTypeModalVisible(true)}
                    className="w-full border border-slate-200 rounded-2xl bg-slate-50/50 px-6 h-14 flex-row items-center justify-between active:bg-slate-100"
                  >
                    <Text className="text-slate-800 text-base font-['Inter']">
                      {propertyType}
                    </Text>
                    <ChevronDown size={18} color="#64748B" />
                  </Pressable>
                </View>

                <View className="flex-1">
                  <Text className="text-slate-700 font-semibold mb-2 text-md font-['Inter']">
                    Purpose
                  </Text>
                  <View className="flex-row bg-slate-100 p-1 rounded-2xl h-14 items-center">
                    <Pressable
                      onPress={() => handlePurposeChange("Sale")}
                      className={`flex-1 h-full rounded-xl justify-center items-center will-change-auto ${purpose === "Sale" ? "bg-white shadow-sm" : "bg-transparent shadow-none"}`}
                    >
                      <Text
                        className={`font-semibold text-md ${purpose === "Sale" ? "text-[#0A65FF]" : "text-slate-500"}`}
                      >
                        Sale
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handlePurposeChange("Rent")}
                      className={`flex-1 h-full rounded-xl justify-center items-center will-change-auto ${purpose === "Rent" ? "bg-white shadow-sm" : "bg-transparent shadow-none"}`}
                    >
                      <Text
                        className={`font-semibold text-md ${purpose === "Rent" ? "text-[#0A65FF]" : "text-slate-500"}`}
                      >
                        Rent
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Target Price */}
              <View>
                <Text className="text-slate-700 font-semibold mb-2 text-md font-['Inter']">
                  Target Price (NGN)
                </Text>
                <View className="w-full border border-slate-200 rounded-2xl bg-slate-50/50 px-4 h-14 flex-row items-center">
                  <Text className="text-slate-400 font-['Inter'] text-base mr-1">
                    ₦
                  </Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    className="flex-1 text-slate-800 text-base font-['Inter'] h-full"
                  />
                </View>
              </View>

              {/* Location Selector */}
              <View>
                <Text className="text-slate-700 font-semibold mb-2 text-md font-['Inter']">
                  Location
                </Text>
                <View className="relative w-full h-44 rounded-3xl overflow-hidden border border-slate-200 bg-slate-100">
                  <Image
                    source={{
                      uri: "https://miro.medium.com/v2/resize:fit:1400/1*q3ZisvY66gD60g967Wq63A.png",
                    }}
                    className="w-full h-full opacity-60"
                  />
                  <View className="absolute top-3 left-3 right-3 bg-white/95 backdrop-blur rounded-2xl border border-slate-100 h-12 px-4 flex-row items-center shadow-sm">
                    <Search size={18} color="#94A3B8" className="mr-2" />
                    <TextInput
                      value={address}
                      onChangeText={setAddress}
                      placeholder="Search address..."
                      placeholderTextColor="#94A3B8"
                      className="flex-1 text-slate-800 text-md font-['Inter'] h-full"
                    />
                  </View>
                  <View className="absolute top-1/2 left-1/2 -ml-3 -mt-3">
                    <MapPin size={28} color="#0A65FF" fill="#DBEAFE" />
                  </View>
                </View>
                <Text className="text-md text-slate-400 font-['Inter'] mt-2 text-center">
                  Drag the map to pin the exact location
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Step 1 Footer Row */}
          <View className="border-t border-slate-100 px-6 py-4 flex-row items-center justify-between bg-white">
            <Pressable>
              <Text className="text-slate-800 font-semibold font-['Inter'] text-md">
                Save Draft
              </Text>
            </Pressable>
            <Pressable
              disabled={!isStep1Valid}
              onPress={() => setStep(2)}
              className={`bg-[#0A65FF] px-6 h-12 rounded-2xl flex-row items-center justify-center shadow-sm ${
                !isStep1Valid ? "opacity-40" : ""
              }`}
            >
              <Text className="text-white font-semibold font-['Inter'] text-md mr-1">
                Next Step
              </Text>
              <Text className="text-white font-bold"> <ChevronRight color={"white"}/> </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* --- STEP 2: MEDIA UPLOADS --- */}
      {step === 2 && (
        <Animated.View entering={FadeInRight} className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="px-6 py-4"
          >
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row space-x-1 items-center flex-1 mr-4">
                <View className="h-1 bg-[#0A65FF] rounded-full flex-1" />
                <View className="h-1 bg-[#0A65FF] rounded-full flex-1" />
                <View className="h-1 bg-[#0A65FF] rounded-full flex-1" />
                <View className="h-1 bg-slate-100 rounded-full flex-1" />
              </View>
              <Text className="text-md font-semibold text-slate-400 font-['Inter']">
                Step 3 of 4
              </Text>
            </View>

            <View className="mb-2">
              <Text className="text-xl font-bold text-slate-900 font-['Poppins']">
                Add Photos
              </Text>
              <Text className="text-md text-slate-400 font-['Inter']">
                Add up to 20 photos
              </Text>
            </View>

            {/* Photo Grid */}
            <View className="flex-row flex-wrap -mx-1 mb-6">
              {photos.map((uri, index) => (
                <View
                  key={index}
                  style={{ width: (width - 48) / 3 }}
                  className="p-1 aspect-square relative"
                >
                  <Image
                    source={{ uri }}
                    className="w-full h-full rounded-2xl bg-slate-100"
                  />
                  <Pressable
                    onPress={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-black/40 w-5 h-5 rounded-full items-center justify-center"
                  >
                    <X size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}

              <View
                style={{ width: (width - 48) / 3 }}
                className="p-1 aspect-square"
              >
                <Pressable className="w-full h-full border-2 border-dashed border-blue-200 bg-blue-50/20 rounded-2xl items-center justify-center">
                  <Plus size={20} color="#0A65FF" className="mb-1" />
                  <Text className="text-md font-semibold text-[#0A65FF] font-['Inter']">
                    Add More
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Video Upload Area */}
            <View className="mb-4">
              <Text className="text-base font-bold text-slate-900 font-['Poppins'] mb-2">
                Add Video{" "}
                <Text className="text-slate-400 font-normal">(Optional)</Text>
              </Text>
              <Pressable className="w-full border border-slate-200 rounded-2xl bg-white p-5 flex-row items-center border-dashed">
                <View className="w-12 h-12 bg-blue-50 rounded-xl items-center justify-center mr-4">
                  <Video size={22} color="#0A65FF" />
                </View>
                <View className="flex-1">
                  <Text className="text-md font-semibold text-slate-800 font-['Inter']">
                    Upload Video
                  </Text>
                  <Text className="text-md text-slate-400 font-['Inter'] mt-0.5">
                    MP4, MOV up to 100MB
                  </Text>
                </View>
              </Pressable>
            </View>
          </ScrollView>

          {/* Step 2 Footer Control */}
          <View className="border-t border-slate-100 px-6 py-4 flex-row space-x-3 bg-white">
            <Pressable
              onPress={() => setStep(1)}
              className="flex-1 bg-slate-100 h-14 rounded-2xl items-center justify-center"
            >
              <Text className="text-slate-700 font-semibold font-['Inter'] text-base">
                Back
              </Text>
            </Pressable>
            <Pressable
              disabled={!isStep2Valid}
              onPress={() => setStep(3)}
              className={`flex-2 bg-[#0A65FF] h-14 rounded-2xl items-center justify-center shadow-md ${
                !isStep2Valid ? "opacity-40" : ""
              }`}
            >
              <Text className="text-white font-semibold font-['Inter'] text-base">
                Next: Review
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* --- STEP 3: SUCCESS PUBLISHED SCREEN --- */}
      {step === 3 && (
        <Animated.View
          entering={FadeIn}
          className="flex-1 bg-slate-50/50 justify-between"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 2 }}
            className="px-6 mb-5"
          >
            <View className="items-center mt-6 mb-6">
              <View className="w-24 h-24 bg-emerald-50 rounded-full justify-center items-center border border-emerald-100">
                <View className="w-16 h-16 bg-emerald-500 rounded-full justify-center items-center shadow-sm">
                  <CheckCircle2 size={36} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </View>
            </View>

            <Text className="text-2xl font-bold text-center text-slate-900 font-['Poppins'] px-4 mb-2">
              Listing Published Successfully!
            </Text>
            <Text className="text-slate-400 text-center font-['Inter'] text-[14px] leading-5 px-6 mb-8">
              Your property has been listed successfully and is now live on the
              platform.
            </Text>

            {/* Property Item Card */}
            <View className="bg-white rounded-3xl p-4 border border-slate-100 flex-row items-center shadow-sm shadow-slate-100 mb-8">
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500",
                }}
                className="w-24 h-24 rounded-2xl bg-slate-100 mr-4"
              />
              <View className="flex-1 justify-center">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-base font-bold text-slate-800 font-['Poppins'] truncate flex-1 mr-2">
                    3 Bedroom Apartment
                  </Text>
                  <View className="bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-bold text-emerald-600 font-['Inter'] uppercase">
                      Active
                    </Text>
                  </View>
                </View>
                <Text className="text-md text-slate-400 font-['Inter'] mb-2">
                  Lekki Phase 1, Lagos
                </Text>
                <Text className="text-lg font-bold text-[#0A65FF] font-['Poppins']">
                  ₦45,000,000
                </Text>
              </View>
            </View>

            {/* "What's Next" Content Section */}
            <View className="px-1">
              <Text className="text-md font-bold text-slate-400 tracking-wider font-['Inter'] uppercase mb-4">
                What&apos;s Next?
              </Text>

              <View className="space-y-4">
                <View className="flex-row items-start mb-4">
                  <View className="w-10 h-10 rounded-xl bg-slate-100/80 items-center justify-center mr-4">
                    <Share2 size={16} color="#64748B" />
                  </View>
                  <View className="flex-1 pt-0.5">
                    <Text className="text-md font-semibold text-slate-700 font-['Inter']">
                      Share your listing
                    </Text>
                    <Text className="text-md text-slate-400 font-['Inter'] mt-0.5">
                      Share your listing to get more visibility
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start mb-4">
                  <View className="w-10 h-10 rounded-xl bg-slate-100/80 items-center justify-center mr-4">
                    <MessageSquare size={16} color="#64748B" />
                  </View>
                  <View className="flex-1 pt-0.5">
                    <Text className="text-md font-semibold text-slate-700 font-['Inter']">
                      Respond to enquiries
                    </Text>
                    <Text className="text-md text-slate-400 font-['Inter'] mt-0.5">
                      Respond to enquiries from interested buyers
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <View className="w-10 h-10 rounded-xl bg-slate-100/80 items-center justify-center mr-4">
                    <Sliders size={16} color="#64748B" />
                  </View>
                  <View className="flex-1 pt-0.5">
                    <Text className="text-md font-semibold text-slate-700 font-['Inter']">
                      Manage your listing
                    </Text>
                    <Text className="text-md text-slate-400 font-['Inter'] mt-0.5">
                      Manage your listing anytime from My Listings
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Success Primary Actions Footer */}
          <View className="px-6 py-4 space-y-3 bg-white border-t border-slate-100">
            <Pressable
              className="w-full bg-[#0A65FF] h-14 rounded-2xl items-center justify-center shadow-md"
              onPress={() => {
                router.replace("/(agent)/listings");
              }}
            >
              <Text className="text-white font-semibold font-['Inter'] text-base">
                View My Listing
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                router.replace("/(agent)/dashboard");
              }}
              className="w-full h-12 items-center justify-center"
            >
              <Text className="text-[#0A65FF] font-semibold font-['Inter'] text-md">
                Back to Dashboard
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* --- SELECT PROPERTY TYPE OVERLAY MODAL --- */}
      <Modal
        visible={isTypeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsTypeModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable
            className="flex-1"
            onPress={() => setIsTypeModalVisible(false)}
          />
          <View className="bg-white rounded-t-4xl px-6 pt-6 pb-10 shadow-xl max-h-[70%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-900 font-['Poppins']">
                Select Property Type
              </Text>
              <Pressable
                onPress={() => setIsTypeModalVisible(false)}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X size={18} color="#475569" />
              </Pressable>
            </View>

            <FlatList
              data={getFilteredPropertyTypes()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = propertyType === item;
                return (
                  <Pressable
                    onPress={() => {
                      setPropertyType(item);
                      setIsTypeModalVisible(false);
                    }}
                    className={`flex-row items-center justify-between py-4 border-b border-slate-100 px-2 ${
                      isSelected ? "bg-blue-50/40 rounded-xl" : ""
                    }`}
                  >
                    <Text
                      className={`text-base font-['Inter'] ${isSelected ? "text-[#0A65FF] font-semibold" : "text-slate-700"}`}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Check size={20} color="#0A65FF" strokeWidth={2.5} />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
