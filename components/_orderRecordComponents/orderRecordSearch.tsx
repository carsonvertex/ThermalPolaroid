import { useLanguageStore } from "@/lib/stores/language-store";
import Constants from "expo-constants";
import React from "react";
import { Platform, View } from "react-native";
import { Button, Card, useTheme } from "react-native-paper";

// Lazy load DatePicker to avoid issues in Expo Go
// react-native-date-picker requires native modules that aren't available in Expo Go
// Check execution environment BEFORE trying to load the module
let DatePicker: any = null;
const isExpoGo = Constants.executionEnvironment === "storeClient";

// Only try to load DatePicker if NOT in Expo Go and NOT on web
if (!isExpoGo && Platform.OS !== "web") {
  try {
    DatePicker = require("react-native-date-picker").default;
  } catch (error) {
    // DatePicker not available - will disable date picker buttons
    DatePicker = null;
  }
}

interface OrderRecordSearchProps {
  onSearch: (searchTerm: string, startDate?: number, endDate?: number) => void;
  onClear: () => void;
  loading?: boolean;
}

export default function OrderRecordSearch({
  onSearch,
  onClear,
  loading = false,
}: OrderRecordSearchProps) {
  const { language } = useLanguageStore();

  // Set default date range: today 12:00 AM to 11:59 PM
  const getStartOfDay = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getEndOfDay = () => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  };

  const today = new Date();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [fromDate, setFromDate] = React.useState<Date | null>(getStartOfDay());
  const [toDate, setToDate] = React.useState<Date | null>(getEndOfDay());
  const [openFromPicker, setOpenFromPicker] = React.useState(false);
  const [openToPicker, setOpenToPicker] = React.useState(false);
  const theme = useTheme();
  const handleSearch = () => {
    const startTimestamp = fromDate ? fromDate.getTime() : undefined;
    const endTimestamp = toDate ? toDate.getTime() : undefined;

    if (searchTerm.trim() || fromDate || toDate) {
      onSearch(searchTerm.trim(), startTimestamp, endTimestamp);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setFromDate(getStartOfDay());
    setToDate(getEndOfDay());
    onClear();
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleDateString();
  };

  const hasFilters = searchTerm.trim() || fromDate || toDate;

  // Check if DatePicker is available (not available in Expo Go)
  // In Expo Go, native modules aren't available, so disable date picker buttons
  const isDatePickerAvailable = DatePicker !== null && !isExpoGo && Platform.OS !== "web";

  return (
    <Card
      style={{
        marginBottom: 12,
        backgroundColor: theme.colors.surface,
      }}
      elevation={1}
    >
      <Card.Content style={{ padding: 12 }}>
        {/* Search Input */}
        {/* <View className="mb-3">
        <TextInput
          mode="outlined"
          placeholder={language === "en" ? "Search orders by ID, staff" : "按ID、員工搜索訂單"}
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
          left={<TextInput.Icon icon="magnify" />}
          right={
            searchTerm ? (
              <TextInput.Icon icon="close" onPress={() => setSearchTerm("")} />
            ) : null
          }
        />
      </View> */}

        {/* Date Pickers */}
        <View className="flex-row gap-2 mb-1.5">
          <View className="flex-1">
            <Button
              mode="elevated"
              onPress={() => {
                if (isDatePickerAvailable) {
                  setOpenFromPicker(true);
                } else {
                  // Date picker not available in Expo Go
                  console.warn("Date picker not available in Expo Go. Please use a development build.");
                }
              }}
              icon="calendar"
              compact
              contentStyle={{ height: 36 }}
              labelStyle={{ fontSize: 12 }}
              disabled={!isDatePickerAvailable}
            >
              From:
              {fromDate
                ? formatDate(fromDate)
                : language === "en"
                ? "From Date"
                : "從日期"}
            </Button>
{openFromPicker && isDatePickerAvailable && DatePicker && !isExpoGo && (
              <DatePicker
                modal
                open={openFromPicker}
                date={fromDate || today}
                maximumDate={toDate || undefined}
                onConfirm={(date: Date) => {
                  setOpenFromPicker(false);
                  // If selected from date is after to date, adjust to date
                  if (toDate && date > toDate) {
                    setToDate(date);
                  }
                  setFromDate(date);
                }}
                onCancel={() => {
                  setOpenFromPicker(false);
                }}
              />
            )}
          </View>

          <View className="flex-1">
            <Button
              mode="elevated"
              onPress={() => {
                if (isDatePickerAvailable) {
                  setOpenToPicker(true);
                } else {
                  // Date picker not available in Expo Go
                  console.warn("Date picker not available in Expo Go. Please use a development build.");
                }
              }}
              icon="calendar"
              compact
              contentStyle={{ height: 36 }}
              labelStyle={{ fontSize: 12 }}
              disabled={!isDatePickerAvailable}
            >
              To:
              {toDate
                ? formatDate(toDate)
                : language === "en"
                ? "To Date"
                : "至日期"}
            </Button>
{openToPicker && isDatePickerAvailable && DatePicker && !isExpoGo && (
              <DatePicker
                modal
                open={openToPicker}
                date={toDate || today}
                minimumDate={fromDate || undefined}
                onConfirm={(date: Date) => {
                  setOpenToPicker(false);
                  // If selected to date is before from date, adjust from date
                  if (fromDate && date < fromDate) {
                    setFromDate(date);
                  }
                  setToDate(date);
                }}
                onCancel={() => {
                  setOpenToPicker(false);
                }}
              />
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center gap-2">
          <Button
            mode="contained"
            onPress={handleSearch}
            loading={loading}
            disabled={loading || !hasFilters}
            icon="magnify"
            className="flex-1"
            compact
            contentStyle={{ height: 36 }}
            labelStyle={{ fontSize: 12 }}
          >
            {language === "en" ? "Search" : "搜索"}
          </Button>

          {(hasFilters ||
            fromDate != getStartOfDay() ||
            toDate != getEndOfDay()) && (
            <Button
              mode="text"
              onPress={handleClear}
              icon="close"
              compact
              contentStyle={{ height: 36 }}
              labelStyle={{ fontSize: 12 }}
            >
              {language === "en" ? "Clear" : "清空"}
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}
