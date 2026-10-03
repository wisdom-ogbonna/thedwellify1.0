# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.



import React from "react";
import { View, Button } from "react-native";
import { useModal } from "@/components/CustomModal";

export default function HomeScreen() {
  const { showModal } = useModal();

  // 1. Error Modal Example
  const triggerError = () => {
    showModal({
      title: "Something went wrong",
      text: "We couldn't complete your request. Please try again later.",
      type: "error",
      ctaText1: "Okay",
      onCta1: () => console.log("Error acknowledged"),
    });
  };

  // 2. Delete Listing Modal Example
  const triggerDelete = () => {
    showModal({
      title: "Delete Listing?",
      text: "Are you sure you want to delete this listing? This action cannot be undone.",
      type: "delete",
      ctaText1: "Delete",
      ctaText2: "Cancel",
      onCta1: () => console.log("Deleted!"),
      onCta2: () => console.log("Cancelled deletion"),
    });
  };

  // 3. Logout Modal Example
  const triggerLogout = () => {
    showModal({
      title: "Log Out?",
      text: "Are you sure you want to log out?",
      type: "logout",
      ctaText1: "Log Out",
      ctaText2: "Cancel",
      onCta1: () => console.log("Logged out"),
    });
  };

  // 4. Success Modal Example
  const triggerSuccess = () => {
    showModal({
      title: "Successful",
      text: "Your listing has been successfully updated. You can now view it in your listings tab.",
      type: "success",
      ctaText1: "Return Home",
      onCta1: () => console.log("Returned home"),
    });
  };

  return (
    <View className="flex-1 justify-center items-center gap-4">
      <Button title="Trigger Error" onPress={triggerError} />
      <Button title="Trigger Delete" onPress={triggerDelete} />
      <Button title="Trigger Logout" onPress={triggerLogout} />
      <Button title="Trigger Success" onPress={triggerSuccess} />
    </View>
  );
}



ios build id
0cc23b1e-3b4d-44bf-8c76-c4a6819056b3

android build id
af0536c7-3a54-4b48-9746-7db20a90f837