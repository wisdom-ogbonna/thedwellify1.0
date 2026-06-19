import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CalendarBlankIcon,
  CaretLeftIcon,
  CheckCircleIcon,
  FlagIcon,
  HashIcon,
  HouseLineIcon,
  MapPinIcon,
  UserCircleMinusIcon,
  WarningCircleIcon,
  FileTextIcon,
  XIcon,
} from "phosphor-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API } from "../../services/api";
import { formatDate, HistoryItem } from "../(client)/history";

// --- TYPES ---
interface ReportReasonOption {
  id: string;
  label: string;
  description: string;
}

interface StatusStyle {
  bg: string;
  text: string;
}

// --- CONSTANTS ---
const MAX_DESCRIPTION_LENGTH = 500;
const MIN_DESCRIPTION_LENGTH = 10;

const REPORT_REASONS: ReportReasonOption[] = [
  {
    id: "unprofessional",
    label: "Agent was not professional",
    description:
      "The agent's conduct during this inspection was unprofessional.",
  },
  {
    id: "cancelled_no_notice",
    label: "Cancelled without notice",
    description: "Agent cancelled the inspection without prior notice.",
  },
  {
    id: "late_or_no_show",
    label: "Late or did not show up",
    description:
      "Agent was significantly late or did not show up for the inspection.",
  },
  {
    id: "inaccurate_info",
    label: "Provided inaccurate information",
    description:
      "Agent gave inaccurate or misleading information about the property.",
  },
  {
    id: "other",
    label: "Other issue",
    description: "",
  },
];

// --- HELPERS ---
const getStatusStyle = (
  status: string | undefined,
  colors: any,
): StatusStyle => {
  switch (status?.toLowerCase()) {
    case "matched":
      return { bg: colors.border, text: colors.primary };
    case "inspection_started":
      return { bg: "#FEF3C7", text: "#D97706" };
    case "inspection_completed":
      return { bg: "#DBEAFE", text: "#2563EB" };
    case "cancelled":
      return { bg: "#FEE2E2", text: "#DC2626" };
    default:
      return { bg: colors.border, text: colors.text };
  }
};

const formatLabel = (key: string): string =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

// --- DETAIL ROW COMPONENT ---
const DetailRow = ({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colors: any;
}) => (
  <View
    className="flex-row items-start justify-between py-4 px-1 border-b"
    style={{ borderColor: colors.border }}
  >
    <View className="flex-row items-center flex-1 mr-3">
      <View className="mr-2.5 opacity-70">{icon}</View>
      <Text
        className="text-md font-medium"
        style={{ color: colors.text, opacity: 0.6 }}
      >
        {label}
      </Text>
    </View>
    <Text
      className="text-md font-semibold flex-1 text-right"
      style={{ color: colors.text }}
      numberOfLines={3}
    >
      {value}
    </Text>
  </View>
);

// --- REPORT AGENT MODAL ---
const ReportAgentModal = ({
  visible,
  onClose,
  onSubmit,
  submitting,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReasonOption, description: string) => void;
  submitting: boolean;
  colors: any;
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [touched, setTouched] = useState<boolean>(false);

  const selected = REPORT_REASONS.find((r) => r.id === selectedId) || null;
  const trimmedLength = description.trim().length;
  const meetsMinLength = trimmedLength >= MIN_DESCRIPTION_LENGTH;
  const canSubmit = !!selected && meetsMinLength && !submitting;
  const showDescriptionError = touched && !meetsMinLength;

  const handleSelectReason = (reason: ReportReasonOption) => {
    setSelectedId(reason.id);
    if (!description.trim() && reason.description) {
      setDescription(reason.description);
    }
  };

  const handleClose = () => {
    setSelectedId(null);
    setDescription("");
    setTouched(false);
    onClose();
  };

  const handleSubmitPress = () => {
    setTouched(true);
    if (selected && meetsMinLength) {
      onSubmit(selected, description.trim());
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <View
          className="rounded-t-3xl px-5 pt-5 pb-8"
          style={{ backgroundColor: colors.card, maxHeight: "88%" }}
        >
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              Report Agent
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.border }}
            >
              <XIcon size={16} color={colors.text} weight="bold" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text
              className="text-sm font-semibold uppercase tracking-wider mb-3"
              style={{ color: colors.text, opacity: 0.5 }}
            >
              Select a reason
            </Text>

            {REPORT_REASONS.map((reason) => {
              const isSelected = reason.id === selectedId;
              return (
                <TouchableOpacity
                  key={reason.id}
                  onPress={() => handleSelectReason(reason)}
                  className="flex-row items-center justify-between p-4 mb-2.5 rounded-2xl border"
                  style={{
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected
                      ? `${colors.primary}14`
                      : colors.background,
                  }}
                >
                  <Text
                    className="text-md font-semibold flex-1 mr-2"
                    style={{ color: colors.text }}
                  >
                    {reason.label}
                  </Text>
                  {isSelected && (
                    <CheckCircleIcon
                      size={20}
                      color={colors.primary}
                      weight="fill"
                    />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Description field */}
            <View className="flex-row items-center justify-between mt-5 mb-2">
              <Text
                className="text-sm font-semibold uppercase tracking-wider"
                style={{ color: colors.text, opacity: 0.5 }}
              >
                Additional description
              </Text>
              <Text
                className="text-sm font-medium"
                style={{
                  color:
                    description.length >= MAX_DESCRIPTION_LENGTH
                      ? "#DC2626"
                      : colors.text,
                  opacity:
                    description.length >= MAX_DESCRIPTION_LENGTH ? 1 : 0.4,
                }}
              >
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </Text>
            </View>

            <TextInput
              value={description}
              onChangeText={(text) => {
                if (text.length <= MAX_DESCRIPTION_LENGTH) {
                  setDescription(text);
                }
              }}
              onBlur={() => setTouched(true)}
              placeholder="Tell us what happened with this agent..."
              placeholderTextColor={`${colors.text}66`}
              multiline
              numberOfLines={5}
              maxLength={MAX_DESCRIPTION_LENGTH}
              textAlignVertical="top"
              className="rounded-2xl border p-4 text-md"
              style={{
                borderColor: showDescriptionError ? "#DC2626" : colors.border,
                backgroundColor: colors.background,
                color: colors.text,
                minHeight: 110,
              }}
            />

            {showDescriptionError ? (
              <Text
                className="text-sm font-medium mt-1.5"
                style={{ color: "#DC2626" }}
              >
                {trimmedLength === 0
                  ? "A description is required."
                  : `Please add at least ${MIN_DESCRIPTION_LENGTH} characters (${MIN_DESCRIPTION_LENGTH - trimmedLength} more needed).`}
              </Text>
            ) : (
              <Text
                className="text-sm mt-1.5"
                style={{ color: colors.text, opacity: 0.4 }}
              >
                Minimum {MIN_DESCRIPTION_LENGTH} characters.
              </Text>
            )}

            <TouchableOpacity
              disabled={!canSubmit}
              onPress={handleSubmitPress}
              className="mt-5 py-4 rounded-2xl items-center justify-center flex-row"
              style={{
                backgroundColor: canSubmit ? "#DC2626" : colors.border,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <FlagIcon
                    size={16}
                    color={canSubmit ? "#fff" : colors.text}
                    weight="bold"
                  />
                  <Text
                    className="text-md font-bold ml-2"
                    style={{ color: canSubmit ? "#fff" : colors.text }}
                  >
                    Submit Report
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// --- MAIN SCREEN ---
export default function ClientHistoryEventScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ item?: string; address?: string }>();

  const item: HistoryItem | null = useMemo(() => {
    if (!params.item) return null;
    try {
      return JSON.parse(params.item) as HistoryItem;
    } catch {
      return null;
    }
  }, [params.item]);

  const address = params.address || "Address unavailable";

  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportState, setReportState] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  if (!item) {
    return (
      <View
        className="flex-1 items-center justify-center px-10"
        style={{ backgroundColor: colors.background }}
      >
        <WarningCircleIcon size={40} color={colors.text} weight="light" />
        <Text
          className="text-base font-semibold mt-4 text-center"
          style={{ color: colors.text }}
        >
          This history record could not be loaded.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 px-5 py-3 rounded-xl"
          style={{ backgroundColor: colors.primary }}
        >
          <Text
            className="text-md font-semibold"
            style={{ color: colors.background }}
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusStyle = getStatusStyle(item.status, colors);
  const hasCoordinates =
    typeof item.lat === "number" && typeof item.lng === "number";

  const handleSubmitReport = async (
    reason: ReportReasonOption,
    description: string,
  ) => {
    if (!item.requestId) {
      setErrorMessage("This inspection has no associated request ID.");
      setReportState("error");
      return;
    }

    setSubmitting(true);
    setReportState("idle");
    setErrorMessage("");

    try {
      console.log(item.requestId, reason.label, description);
      await API.post("/client/report-agent", {
        requestId: item.requestId,
        reason: reason.label,
        description,
      });
      setSubmitting(false);
      setModalVisible(false);
      setReportState("success");
    } catch (error: any) {
      console.error("Report Agent Error:", error);
      setSubmitting(false);
      setErrorMessage(
        error?.response?.data?.message ||
          "Could not submit your report. Please try again.",
      );
      setReportState("error");
    }
  };

  return (
    <View
      className="flex-1 py-6"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <View className="flex-row items-center px-5 pt-4 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full items-center justify-center border"
          style={{ borderColor: colors.border, backgroundColor: colors.card }}
        >
          <CaretLeftIcon size={16} color={colors.text} weight="bold" />
        </TouchableOpacity>
        <Text
          className="text-base font-bold ml-3"
          style={{ color: colors.text }}
        >
          Inspection Details
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View
          className="p-5 rounded-3xl border mb-5"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-3">
              <Text
                className="text-2xl font-bold"
                style={{ color: colors.text }}
              >
                {item.propertyType || "Property Inspection"}
              </Text>
              <View className="flex-row items-center mt-1.5">
                <FileTextIcon size={12} color="#71717a" weight="bold" />
                <Text className="text-sm text-zinc-500 ml-1">{item.id}</Text>
              </View>
            </View>
            <View
              className="px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: statusStyle.bg }}
            >
              <Text
                className="text-[10px] font-bold tracking-wider"
                style={{ color: statusStyle.text }}
              >
                {(item.status || "unknown").replace(/_/g, " ").toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Details Section */}
        <Text
          className="text-sm font-semibold uppercase tracking-wider mb-2 ml-1"
          style={{ color: colors.text, opacity: 0.5 }}
        >
          Timeline
        </Text>
        <View
          className="rounded-3xl border px-4 mb-5"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <DetailRow
            icon={<CalendarBlankIcon size={16} color={colors.text} />}
            label="Created"
            value={formatDate(item.createdAt)}
            colors={colors}
          />
          <DetailRow
            icon={<CalendarBlankIcon size={16} color={colors.text} />}
            label="Inspection Started"
            value={formatDate(item.inspectionStartedAt)}
            colors={colors}
          />
          <View className="py-4 px-1 flex-row items-start justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="mr-2.5 opacity-70">
                <CalendarBlankIcon size={16} color={colors.text} />
              </View>
              <Text
                className="text-md font-medium"
                style={{ color: colors.text, opacity: 0.6 }}
              >
                Inspection Ended
              </Text>
            </View>
            <Text
              className="text-md font-semibold flex-1 text-right"
              style={{ color: colors.text }}
            >
              {formatDate(item.inspectionEndedAt)}
            </Text>
          </View>
        </View>

        {/* Location Section */}
        <Text
          className="text-sm font-semibold uppercase tracking-wider mb-2 ml-1"
          style={{ color: colors.text, opacity: 0.5 }}
        >
          Location
        </Text>
        <View
          className="rounded-3xl border p-4 mb-5"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View className="flex-row items-start">
            <MapPinIcon size={18} color={colors.primary} weight="fill" />
            <View className="ml-2.5 flex-1">
              <Text
                className="text-md font-semibold"
                style={{ color: colors.text }}
              >
                {address}
              </Text>
              {hasCoordinates && (
                <Text className="text-sm text-zinc-500 mt-1">
                  {item.lat?.toFixed(6)}, {item.lng?.toFixed(6)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Cancellation Section (only if present) */}
        {(item.cancelledAt || item.cancelledBy || item.cancelReason) && (
          <>
            <Text
              className="text-sm font-semibold uppercase tracking-wider mb-2 ml-1"
              style={{ color: "#DC2626" }}
            >
              Cancellation Details
            </Text>
            <View
              className="rounded-3xl border px-4 mb-5"
              style={{ backgroundColor: colors.card, borderColor: "#FEE2E2" }}
            >
              {item.cancelledAt && (
                <DetailRow
                  icon={<XIcon size={16} color="#DC2626" />}
                  label="Cancelled At"
                  value={formatDate(item.cancelledAt)}
                  colors={colors}
                />
              )}
              {item.cancelledBy && (
                <DetailRow
                  icon={<UserCircleMinusIcon size={16} color="#DC2626" />}
                  label="Cancelled By"
                  value={formatLabel(item.cancelledBy)}
                  colors={colors}
                />
              )}
              {item.cancelReason && (
                <View className="py-4 px-1">
                  <View className="flex-row items-center mb-1.5">
                    <WarningCircleIcon size={16} color="#DC2626" />
                    <Text
                      className="text-md font-medium ml-2.5"
                      style={{ color: colors.text, opacity: 0.6 }}
                    >
                      Reason
                    </Text>
                  </View>
                  <Text
                    className="text-md font-semibold pl-7"
                    style={{ color: colors.text }}
                  >
                    {item.cancelReason}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Inline feedback messages */}
        {reportState === "success" && (
          <View
            className="flex-row items-center p-4 rounded-2xl mb-5"
            style={{ backgroundColor: "#DCFCE7" }}
          >
            <CheckCircleIcon size={18} color="#16A34A" weight="fill" />
            <Text
              className="text-md font-semibold ml-2.5"
              style={{ color: "#16A34A" }}
            >
              Report submitted. Our team will review it shortly.
            </Text>
          </View>
        )}
        {reportState === "error" && (
          <View
            className="flex-row items-center p-4 rounded-2xl mb-5"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <WarningCircleIcon size={18} color="#DC2626" weight="fill" />
            <Text
              className="text-md font-semibold ml-2.5 flex-1"
              style={{ color: "#DC2626" }}
            >
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Report Agent Button */}
        <TouchableOpacity
          onPress={() => {
            setReportState("idle");
            setModalVisible(true);
          }}
          className="flex-row items-center justify-center py-4 rounded-2xl border mt-2"
          style={{ borderColor: "#DC2626" }}
        >
          <FlagIcon size={16} color="#DC2626" weight="bold" />
          <Text className="text-md font-bold ml-2" style={{ color: "#DC2626" }}>
            Report Agent
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ReportAgentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitReport}
        submitting={submitting}
        colors={colors}
      />
    </View>
  );
}
