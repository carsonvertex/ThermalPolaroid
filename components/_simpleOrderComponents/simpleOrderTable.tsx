import { useLanguageStore } from "@/lib/stores/language-store";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Card, DataTable, useTheme } from "react-native-paper";
import { ThemedText } from "../ui";
import SimpleOrderTableRow from "./simpleOrderTableRow";

export default function SimpleOrderTable({
  values,
  setFieldValue,
  manualInput,
  setManualInput,
}: {
  manualInput?: boolean;
  setManualInput: (value: boolean) => void;
  values: any;
  setFieldValue: (field: string, value: any) => void;
}) {
  const { language } = useLanguageStore();
  const theme = useTheme();
  return (
    <Card
      style={{
        marginBottom: 16,
        backgroundColor: theme.colors.surface,
      }}
      elevation={2}
    >
      <Card.Content style={{ padding: 16 }}>
        <ThemedText>{language === "en" ? "Items" : "項目"}</ThemedText>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <DataTable>
            <DataTable.Header>
            <DataTable.Title className="text-xs">#</DataTable.Title>
            <DataTable.Title numeric className="justify-center">
              SKU
            </DataTable.Title>
            <DataTable.Title numeric className="justify-center">
              {language === "en" ? "Qty" : "數量"}
            </DataTable.Title>
            <DataTable.Title numeric className="justify-center">
              {language === "en" ? "Price" : "單價"}
            </DataTable.Title>
            <DataTable.Title numeric className="justify-center">
              {language === "en" ? "Total" : "總額"}
            </DataTable.Title>
            {/* <DataTable.Title className="justify-center">
              {language === "en" ? "Action" : "操作"}
            </DataTable.Title> */}
          </DataTable.Header>

          {values.products.map((product: any, index: number) => {
            return (
              <SimpleOrderTableRow
                manualInput={manualInput}
                setManualInput={setManualInput}
                key={product.id || index}
                values={values}
                product={product}
                setFieldValue={setFieldValue}
                index={index}
              />
            );
          })}

          <DataTable.Row>
            <DataTable.Cell numeric>
              <ThemedText style={{ fontSize: 10,fontWeight: "bold" }}>
                {values.products
                  .reduce(
                    (total: number, product: any) =>
                      total + product.quantity * product.unitPrice,
                    0
                  )
                  .toFixed(2)} 
                {language === "en" ? " HKD" : " 港幣"}
              </ThemedText>
            </DataTable.Cell>
          </DataTable.Row>
        </DataTable>
        </GestureHandlerRootView>
      </Card.Content>
    </Card>
  );
}
