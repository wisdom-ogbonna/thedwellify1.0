import { Building, Calendar, Clock, Tag, User } from "phosphor-react-native";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyType?: string;
  price?: number;
  agentName?: string;
  dateTime?: string;
  onConfirm: () => void;
}

function ConfirmBookingModal({
  isOpen,
  onClose,
  propertyType = "Modern Lagos Penthouse",
  price = 5000,
  agentName = "Byron A. (Verified)",
  dateTime = "Fri, Nov 15th | 2:00 PM",
  onConfirm,
}: ModalProps) {
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop overlay */}
      <View className="flex-1 justify-end bg-black/60">
        {/* Bottom Sheet Container */}
        <View className="bg-white rounded-t-[36px] px-6 pt-3 pb-8 w-full shadow-2xl">
          {/* Drag Handle Indicator */}
          <View className="items-center mb-4">
            <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-2xl font-bold text-gray-900">
              Confirm Booking
            </Text>
            <Calendar size={24} color="#111827" weight="regular" />
          </View>

          {/* Subtitle */}
          <Text className="text-gray-500 text-sm mb-6">
            Are you sure you want to book this agent for an inspection?
          </Text>

          {/* Details Card */}
          <View className="bg-gray-50/80 border border-gray-100 rounded-3xl p-4 mb-6 gap-4">
            {/* Property */}
            <View className="flex-row items-center">
              <Building size={20} color="#6B7280" weight="regular" />
              <Text className="text-gray-800 font-medium text-sm ml-3 flex-1">
                Property:{" "}
                <Text className="font-bold text-gray-900">{propertyType}</Text>
              </Text>
            </View>

            {/* Price */}
            <View className="flex-row items-center">
              <Tag size={20} color="#D97706" weight="regular" />
              <Text className="text-gray-800 font-medium text-sm ml-3 flex-1">
                Price:{" "}
                <Text className="font-bold text-[#B45309]">
                  ₦{price.toLocaleString()}
                </Text>
              </Text>
            </View>

            {/* Agent */}
            <View className="flex-row items-center">
              <User size={20} color="#6B7280" weight="regular" />
              <Text className="text-gray-800 font-medium text-sm ml-3 flex-1">
                Agent:{" "}
                <Text className="font-bold text-gray-900">{agentName}</Text>
              </Text>
            </View>

            {/* Date & Time */}
            <View className="flex-row items-center">
              <Clock size={20} color="#6B7280" weight="regular" />
              <Text className="text-gray-800 font-medium text-sm ml-3 flex-1">
                Date & Time:{" "}
                <Text className="font-bold text-gray-900">{dateTime}</Text>
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-4 rounded-2xl border border-gray-200 items-center justify-center bg-white"
            >
              <Text className="text-gray-900 text-base font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              className="flex-1 py-4 rounded-2xl bg-[#0055FF] items-center justify-center flex-row gap-2 shadow-sm"
            >
              <Text className="text-white text-base font-semibold">
                Confirm
              </Text>
              <View className="w-2 h-2 rounded-full bg-cyan-300" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export { ConfirmBookingModal };
