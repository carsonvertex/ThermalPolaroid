import { useDeviceInfo } from '@/hooks/use-device-info';
import { useLanguageStore } from '@/lib/stores/language-store';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { rcBase64 } from './rcbase64';

// Lazy load Sunmi printer library
let SunmiPrinterLibrary: any = null;
try {
  SunmiPrinterLibrary = require('@mitsuharu/react-native-sunmi-printer-library');
} catch (e) {
  console.log('Sunmi printer library not available');
}

export interface FinancialSummary {
  orderId: number;
  staffId: string;
  date: string;
  status: string;
  productsTotal: number;
  misc: number;
  totalAmount: number;
  discount: number;
  netAmount: number;
  netReceived: number;
  changeAmount: number;
  paymentReference?: string;
  paymentMethod?: string; // 'cash', 'octopus', 'credit_card'
}

export interface ProductItem {
  sku?: string;
  productDetail?: string;
  quantity: number;
  unitPrice: number;
  model?: string;
}

export interface PrintReceiptProps {
  financialSummary: FinancialSummary;
  formatCurrency: (amount: number) => string;
  products?: ProductItem[];
  disabled?: boolean;
  className?: string;
}

export function PrintReceipt({
  financialSummary,
  formatCurrency,
  products = [],
  disabled = false,
  className,
}: PrintReceiptProps) {
  const theme = useTheme();
  const { language } = useLanguageStore();
  const deviceInfo = useDeviceInfo();
  const [isPrinting, setIsPrinting] = useState(false);

  // Check if device is Sunmi
  const isSunmiDevice =
    deviceInfo.brand?.toLowerCase().includes('sunmi') ||
    deviceInfo.modelName?.toLowerCase().includes('sunmi');

  // Calculate display width of a string (Chinese/wide chars = 2, ASCII = 1)
  const getDisplayWidth = (str: string): number => {
    let width = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      // Check if character is a wide character (Chinese, Japanese, Korean, etc.)
      // Unicode ranges for CJK characters and other wide characters
      const code = char.charCodeAt(0);
      if (
        (code >= 0x1100 && code <= 0x115F) || // Hangul Jamo
        (code >= 0x2E80 && code <= 0x2EFF) || // CJK Radicals Supplement
        (code >= 0x2F00 && code <= 0x2FDF) || // Kangxi Radicals
        (code >= 0x3000 && code <= 0x303F) || // CJK Symbols and Punctuation
        (code >= 0x3040 && code <= 0x309F) || // Hiragana
        (code >= 0x30A0 && code <= 0x30FF) || // Katakana
        (code >= 0x3100 && code <= 0x312F) || // Bopomofo
        (code >= 0x3130 && code <= 0x318F) || // Hangul Compatibility Jamo
        (code >= 0x3200 && code <= 0x32FF) || // Enclosed CJK Letters and Months
        (code >= 0x3300 && code <= 0x33FF) || // CJK Compatibility
        (code >= 0x3400 && code <= 0x4DBF) || // CJK Unified Ideographs Extension A
        (code >= 0x4E00 && code <= 0x9FFF) || // CJK Unified Ideographs
        (code >= 0xA000 && code <= 0xA48F) || // Yi Syllables
        (code >= 0xA490 && code <= 0xA4CF) || // Yi Radicals
        (code >= 0xAC00 && code <= 0xD7AF) || // Hangul Syllables
        (code >= 0xF900 && code <= 0xFAFF) || // CJK Compatibility Ideographs
        (code >= 0xFE30 && code <= 0xFE4F) || // CJK Compatibility Forms
        (code >= 0xFF00 && code <= 0xFFEF)    // Halfwidth and Fullwidth Forms
      ) {
        width += 2;
      } else {
        width += 1;
      }
    }
    return width;
  };

  // Truncate string to fit display width
  const truncateToWidth = (str: string, maxWidth: number): string => {
    let result = '';
    let width = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const code = char.charCodeAt(0);
      const charWidth = (
        (code >= 0x1100 && code <= 0x115F) ||
        (code >= 0x2E80 && code <= 0x2EFF) ||
        (code >= 0x2F00 && code <= 0x2FDF) ||
        (code >= 0x3000 && code <= 0x303F) ||
        (code >= 0x3040 && code <= 0x309F) ||
        (code >= 0x30A0 && code <= 0x30FF) ||
        (code >= 0x3100 && code <= 0x312F) ||
        (code >= 0x3130 && code <= 0x318F) ||
        (code >= 0x3200 && code <= 0x32FF) ||
        (code >= 0x3300 && code <= 0x33FF) ||
        (code >= 0x3400 && code <= 0x4DBF) ||
        (code >= 0x4E00 && code <= 0x9FFF) ||
        (code >= 0xA000 && code <= 0xA48F) ||
        (code >= 0xA490 && code <= 0xA4CF) ||
        (code >= 0xAC00 && code <= 0xD7AF) ||
        (code >= 0xF900 && code <= 0xFAFF) ||
        (code >= 0xFE30 && code <= 0xFE4F) ||
        (code >= 0xFF00 && code <= 0xFFEF)
      ) ? 2 : 1;
      
      if (width + charWidth > maxWidth) {
        break;
      }
      result += char;
      width += charWidth;
    }
    return result;
  };

  // Pad string to target display width
  const padToWidth = (str: string, targetWidth: number, padChar: string = ' ', padLeft: boolean = false): string => {
    const currentWidth = getDisplayWidth(str);
    const paddingNeeded = Math.max(0, targetWidth - currentWidth);
    
    if (paddingNeeded === 0) {
      return str;
    }
    
    const padding = padChar.repeat(paddingNeeded);
    return padLeft ? padding + str : str + padding;
  };

  // Format text for thermal printer (Sunmi)
  // When printer alignment is set to center, don't add manual padding
  const formatTextForThermal = (text: string, width: number = 32, useManualPadding: boolean = false): string => {
    if (useManualPadding) {
      // Manual center align text (for when printer alignment isn't available)
      const textWidth = getDisplayWidth(text);
      const padding = Math.max(0, Math.floor((width - textWidth) / 2));
      return ' '.repeat(padding) + text;
    }
    // Return text as-is, let printer handle alignment
    return text;
  };

  const formatRow = (label: string, value: string, width: number = 32): string => {
    const labelWidth = Math.floor(width * 0.6);
    const valueWidth = width - labelWidth;
    
    // Truncate label if needed
    const truncatedLabel = truncateToWidth(label, labelWidth);
    const truncatedValue = truncateToWidth(value, valueWidth);
    
    // Pad to exact display width
    const labelPadded = padToWidth(truncatedLabel, labelWidth, ' ', false);
    const valuePadded = padToWidth(truncatedValue, valueWidth, ' ', true);
    
    return labelPadded + valuePadded;
  };

  // Format table row with left, center, right alignment
  const formatTableRow = (col1: string, col2: string, col3: string, width: number = 32): string => {
    const col1Width = Math.floor(width * 0.5);
    const col2Width = Math.floor(width * 0.2);
    const col3Width = width - col1Width - col2Width;
    
    // Truncate columns if needed
    const truncatedCol1 = truncateToWidth(col1, col1Width);
    const truncatedCol2 = truncateToWidth(col2, col2Width);
    const truncatedCol3 = truncateToWidth(col3, col3Width);
    
    // Pad columns to exact display width
    const col1Padded = padToWidth(truncatedCol1, col1Width, ' ', false);
    // Center align col2
    const col2WidthActual = getDisplayWidth(truncatedCol2);
    const col2Padding = Math.max(0, Math.floor((col2Width - col2WidthActual) / 2));
    const col2Padded = ' '.repeat(col2Padding) + truncatedCol2 + ' '.repeat(col2Width - col2WidthActual - col2Padding);
    const col3Padded = padToWidth(truncatedCol3, col3Width, ' ', true);
    
    return col1Padded + col2Padded + col3Padded;
  };

  // Format currency without decimals for receipt printing
  const formatCurrencyNoDecimals = (amount: number): string => {
    return `$${Math.round(amount)}`;
  };

  // Get logo base64 directly from imported constant
  const getLogoBase64 = (): { base64String: string; base64Uri: string } | null => {
    try {
      if (!rcBase64 || rcBase64.length === 0) {
        console.log('Logo base64 data is empty');
        return null;
      }

      console.log('Logo base64 data loaded, length:', rcBase64.length);

      const base64Uri = `data:image/png;base64,${rcBase64}`;
      return {
        base64String: rcBase64,
        base64Uri: base64Uri,
      };
    } catch (error) {
      console.error('Error getting logo base64:', error);
      return null;
    }
  };

  const generateReceiptText = (): string => {
    const {
      orderId,
      date,
      productsTotal,
      misc,
      totalAmount,
      discount,
      netAmount,
      netReceived,
      changeAmount,
      paymentMethod,
    } = financialSummary;

    const isEn = language === 'en';
    const lineWidth = 32;
    const separator = '-'.repeat(lineWidth);

    // Format payment method for display (shortened for receipt label)
    const getPaymentMethodText = (method?: string): string => {
      if (!method) return isEn ? 'Cash' : '現金';
      switch (method.toLowerCase()) {
        case 'cash':
          return isEn ? 'Cash' : '現金';
        case 'octopus':
          return isEn ? 'Octopus' : '八達通';
        case 'credit_card':
        case 'creditcard':
          return isEn ? 'Credit Card' : '信用卡';
        default:
          return method;
      }
    };

    const paymentMethodText = getPaymentMethodText(paymentMethod);

    let receipt = '\n'; // No initial newline - logo is directly above

    // Website URL (centered) - comes after logo
    receipt += formatTextForThermal('hk.ThermalPolaroid.com', lineWidth, false) + '\n';
    
    // Date and Time (centered) - comes after website
    // Don't use manual padding, let printer alignment handle it
    receipt += formatTextForThermal(date, lineWidth, false) + '\n';
    // receipt += '\n';

    // Order Number (centered)
    // Don't use manual padding, let printer alignment handle it
    receipt += formatTextForThermal(
      isEn ? `Order# ${orderId}` : `訂單# ${orderId}`,
      lineWidth,
      false
    ) + '\n';
    receipt += '\n';

    // Products List with table format
    receipt += separator + '\n';
    
    // Table header
    receipt += formatTableRow(
      isEn ? 'Model' : '型號',
      isEn ? 'QTY' : '數量',
      isEn ? 'Price' : '價格',
      lineWidth
    ) + '\n';
    
    receipt += separator + '\n';
    
    // Products
    if (products && products.length > 0) {
      products.forEach((product) => {
        let model = product.model || product.sku || product.productDetail || (isEn ? 'Misc' : '雜項');
        // Truncate model if more than 10 characters, add ".." to replace the remains
        if (model.length > 10) {
          model = model.substring(0, 10) + '..';
        }
        const qty = product.quantity.toString();
        const price = formatCurrencyNoDecimals(product.quantity * product.unitPrice);
        receipt += formatTableRow(model, qty, price, lineWidth) + '\n';
      });
    }
    
    // Misc item only shown if price is not 0
    if (misc !== 0) {
      receipt += formatTableRow(
        isEn ? 'Misc' : '雜項',
        '-',
        formatCurrencyNoDecimals(misc),
        lineWidth
      ) + '\n';
    }
    
    receipt += separator + '\n';
    receipt += '\n';

    // Financial Summary
    // Total with payment method in label / 合計 (with payment method in label)
    const totalLabel = isEn 
      ? `Total - ${paymentMethodText}` 
      : `合計 - ${paymentMethodText}`;
    receipt += formatRow(
      totalLabel,
      formatCurrencyNoDecimals(totalAmount),
      lineWidth
    ) + '\n';
    
    // Discount / 折扣
    receipt += formatRow(
      isEn ? 'Discount' : '折扣',
      `-${formatCurrencyNoDecimals(discount)}`,
      lineWidth
    ) + '\n';
    
    // Net / 單價 (net amount after discount)
    receipt += formatRow(
      isEn ? 'Net' : '單價',
      formatCurrencyNoDecimals(netAmount),
      lineWidth
    ) + '\n';
    
    // Amount Received / 金額收
    receipt += formatRow(
      isEn ? 'Amount Received' : '金額收',
      formatCurrencyNoDecimals(netReceived),
      lineWidth
    ) + '\n';

    // Change with separator - only show if change amount is greater than 0
    if (changeAmount > 0) {
      receipt += separator + '\n';
      receipt += formatRow(
        isEn ? 'Change' : '找零',
        formatCurrencyNoDecimals(changeAmount),
        lineWidth
      ) + '\n';
      receipt += separator + '\n';
    } else {
      receipt += separator + '\n';
    }
    receipt += '\n';

    // Footer
    receipt += formatTextForThermal(
      isEn ? 'Thank You' : '多謝惠顧',
      lineWidth
    ) + '\n';
    receipt += '\n';
    
    // Address lines (left-aligned, not centered)
    receipt += '提貨點\n';
    receipt += '觀塘勵業街46號天輝工業大廈11樓\n';
    receipt += '\n';


    receipt += '門市\n';
    receipt += '旺角廣華街1號仁安大廈地下31號舖\n';
    receipt += '油麻地碧街11號地下\n';
    receipt += '\n';
    
    receipt += '\n\n\n'; // Feed paper

    return receipt;
  };

  // Check printer connectivity
  const checkPrinterConnectivity = async (): Promise<boolean> => {
    if (!isSunmiDevice || !SunmiPrinterLibrary) {
      return false;
    }

    try {
      // Try different methods to check connectivity
      if (SunmiPrinterLibrary.getPrinterStatus) {
        const status = await SunmiPrinterLibrary.getPrinterStatus();
        console.log("Printer status check:", status);
        return status === 0 || status === 1; // 0 = ready, 1 = printing
      }

      if (SunmiPrinterLibrary.isConnected) {
        const connected = await SunmiPrinterLibrary.isConnected();
        console.log("Printer connection check:", connected);
        return connected;
      }

      // If no status method available, try a simple prepare call
      await SunmiPrinterLibrary.prepare();
      console.log("Printer prepare successful - assuming connected");
      return true;
    } catch (error) {
      console.log("Printer connectivity check failed:", error);
      return false;
    }
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);

      // Use Sunmi printer if available and device is Sunmi
      if (isSunmiDevice && SunmiPrinterLibrary) {
        try {
          // Check printer connectivity first
          console.log("Checking printer connectivity...");
          const isPrinterConnected = await checkPrinterConnectivity();

          if (!isPrinterConnected) {
            Alert.alert(
              language === "en" ? "Printer Not Connected" : "打印機未連接",
              language === "en"
                ? "The printer is not connected or not ready. Please check:\n\n• Printer is powered on\n• Printer is properly connected\n• Printer has paper\n• Device is paired with printer"
                : "打印機未連接或未準備好。請檢查：\n\n• 打印機是否開啟電源\n• 打印機是否正確連接\n• 打印機是否有紙張\n• 設備是否與打印機配對",
              [{ text: language === "en" ? "OK" : "確定" }]
            );
            return;
          }

          console.log("Printer connectivity check passed");

          // Prepare the printer
          await SunmiPrinterLibrary.prepare();

          // Set alignment to center for logo and header
          try {
            if (SunmiPrinterLibrary.setAlignment) {
              await SunmiPrinterLibrary.setAlignment('center');
              console.log('Alignment set to center');
            }
          } catch (alignError) {
            console.log('setAlignment not supported or failed:', alignError);
          }

          // Print logo if available
          try {
            const logoData = getLogoBase64();
            console.log('Logo data check:', logoData ? 'Available' : 'Not available');
            if (logoData && SunmiPrinterLibrary.printImage) {
              // Make logo smaller - use 300px width to ensure it fits and centers properly
              // 58mm paper is typically 384px wide, so 300px leaves margin for centering
              const printerWidth = 300; // Smaller logo width for 58mm thermal paper
              const printMode = 'grayscale';
              
              console.log('Attempting to print logo with width:', printerWidth);
              let logoPrinted = false;
              
              // Method 1: Try with just base64 string (most common)
              try {
                await SunmiPrinterLibrary.printImage(logoData.base64String, printerWidth, printMode);
                console.log('✓ Logo printed successfully with base64 string');
                logoPrinted = true;
              } catch (printError1) {
                console.log('Method 1 failed, trying with full data URI...', printError1);
                
                // Method 2: Try with full data URI
                try {
                  await SunmiPrinterLibrary.printImage(logoData.base64Uri, printerWidth, printMode);
                  console.log('✓ Logo printed successfully with data URI');
                  logoPrinted = true;
                } catch (printError2) {
                  console.log('Method 2 failed:', printError2);
                  
                  // Method 3: Try with original width (384) in case smaller width is the issue
                  try {
                    console.log('Trying with original width 384...');
                    await SunmiPrinterLibrary.printImage(logoData.base64String, 384, printMode);
                    console.log('✓ Logo printed successfully with original width');
                    logoPrinted = true;
                  } catch (printError3) {
                    console.log('Method 3 (original width) also failed:', printError3);
                  }
                }
              }
              
              if (logoPrinted) {
                // No spacing - logo directly followed by date/time
                // Flush printer buffer if available
                try {
                  if (SunmiPrinterLibrary.flush) {
                    await SunmiPrinterLibrary.flush();
                  }
                } catch (flushError) {
                  // Flush not available, that's okay
                  console.log('Flush not available');
                }
              } else {
                console.log('All logo printing methods failed');
              }
            } else {
              console.log('Logo data not available or printImage method not found');
            }
          } catch (logoError) {
            console.error('Logo printing error:', logoError);
            // Continue printing even if logo fails
          }

          // Keep center alignment for date/time and order number
          // Don't reset alignment yet - keep it centered for header section
          
          // Reset other printer states
          try {
            // Reset font size to normal (in case logo printing changed it)
            if (SunmiPrinterLibrary.setFontSize) {
              await SunmiPrinterLibrary.setFontSize(0);
            }
            
            // Reset bold if it was set
            if (SunmiPrinterLibrary.setBold) {
              await SunmiPrinterLibrary.setBold(false);
            }
          } catch (resetError) {
            console.log('Printer reset failed (may be normal):', resetError);
          }

          // Generate receipt text (date/time and order number will be centered)
          const receiptText = generateReceiptText();
          
          // Split receipt text to handle alignment changes
          // Find where the separator line starts (32 dashes)
          const separator = '-'.repeat(32);
          const separatorIndex = receiptText.indexOf(separator);
          
          // Find where footer starts (Thank You / 多謝惠顧)
          const isEn = language === 'en';
          const footerMarker = isEn ? 'Thank You' : '多謝惠顧';
          const footerIndex = receiptText.indexOf(footerMarker);
          
          if (separatorIndex > 0 && footerIndex > separatorIndex) {
            // Split into header (centered), body (left-aligned), footer thank you (centered), and addresses (left-aligned)
            const headerText = receiptText.substring(0, separatorIndex); // Website, date/time, order number
            const bodyText = receiptText.substring(separatorIndex, footerIndex); // Items table and financial summary
            const footerText = receiptText.substring(footerIndex); // Thank You and addresses
            
            // Split footer into "Thank You" (centered) and addresses (left-aligned)
            // Find where addresses start (after "Thank You\n\n")
            const addressStartIndex = footerText.indexOf('提貨點');
            const thankYouText = addressStartIndex > 0 
              ? footerText.substring(0, addressStartIndex) 
              : footerText;
            const addressText = addressStartIndex > 0 
              ? footerText.substring(addressStartIndex) 
              : '';
            
            console.log('Receipt text length:', receiptText.length);
            console.log('Header text:', headerText);
            console.log('Body text preview:', bodyText.substring(0, 100));
            console.log('Thank You text:', thankYouText);
            console.log('Address text:', addressText);

            // Print header section (website, date/time, order number) with center alignment
            try {
              await SunmiPrinterLibrary.printText(headerText);
              console.log('✓ Receipt header printed successfully');
            } catch (textError) {
              console.error('Failed to print receipt header:', textError);
              throw textError;
            }
            
            // Now reset alignment to left for the items table and financial summary
            try {
              if (SunmiPrinterLibrary.setAlignment) {
                await SunmiPrinterLibrary.setAlignment('left');
              }
            } catch (alignError) {
              console.log('setAlignment reset failed:', alignError);
            }
            
            // Print body section (items table, financial summary) with left alignment
            try {
              await SunmiPrinterLibrary.printText(bodyText);
              console.log('✓ Receipt body printed successfully');
            } catch (textError) {
              console.error('Failed to print receipt body:', textError);
              throw textError;
            }
            
            // Reset alignment to center for "Thank You"
            try {
              if (SunmiPrinterLibrary.setAlignment) {
                await SunmiPrinterLibrary.setAlignment('center');
              }
            } catch (alignError) {
              console.log('setAlignment to center for footer failed:', alignError);
            }
            
            // Print "Thank You" section with center alignment
            try {
              await SunmiPrinterLibrary.printText(thankYouText);
              console.log('✓ Receipt "Thank You" printed successfully');
            } catch (textError) {
              console.error('Failed to print receipt "Thank You":', textError);
              throw textError;
            }
            
            // Reset alignment to left for addresses (only if addresses exist)
            if (addressText) {
              try {
                if (SunmiPrinterLibrary.setAlignment) {
                  await SunmiPrinterLibrary.setAlignment('left');
                }
              } catch (alignError) {
                console.log('setAlignment to left for addresses failed:', alignError);
              }
              
              // Print address section with left alignment
              try {
                await SunmiPrinterLibrary.printText(addressText);
                console.log('✓ Receipt addresses printed successfully');
              } catch (textError) {
                console.error('Failed to print receipt addresses:', textError);
                throw textError;
              }
            }
          } else if (separatorIndex > 0) {
            // Fallback: split into header and body only (no footer marker found)
            const headerText = receiptText.substring(0, separatorIndex);
            const bodyText = receiptText.substring(separatorIndex);
            
            await SunmiPrinterLibrary.printText(headerText);
            
            try {
              if (SunmiPrinterLibrary.setAlignment) {
                await SunmiPrinterLibrary.setAlignment('left');
              }
            } catch (alignError) {
              console.log('setAlignment reset failed:', alignError);
            }
            
            await SunmiPrinterLibrary.printText(bodyText);
          } else {
            // Fallback: print entire receipt with center alignment
            console.log('Separator not found, printing entire receipt');
            await SunmiPrinterLibrary.printText(receiptText);
          }

          // Cut paper (if supported)
          try {
            await SunmiPrinterLibrary.cutPaper();
          } catch (cutError) {
            // Cut paper might not be supported, that's okay
            console.log('Paper cut not supported or failed:', cutError);
          }
          Alert.alert(
            language === 'en' ? 'Success' : '成功',
            language === 'en'
              ? 'Financial summary printed successfully.'
              : '財務摘要已成功列印。'
          );
        } catch (sunmiError) {
          console.error('Sunmi print error:', sunmiError);
          throw new Error(
            language === 'en'
              ? 'Sunmi printer error. Please check if printer is connected.'
              : 'Sunmi 打印機錯誤。請檢查打印機是否已連接。'
          );
        }
      } else {
        // No printer available for non-Sunmi devices
        Alert.alert(
          language === 'en' ? 'Printer Not Available' : '打印機不可用',
          language === 'en'
            ? 'Printing is only available on Sunmi devices with a built-in printer.'
            : '列印僅在帶有內置打印機的 Sunmi 設備上可用。'
        );
      }
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert(
        language === 'en' ? 'Error' : '錯誤',
        language === 'en'
          ? `Failed to print:\n${
              error instanceof Error ? error.message : String(error)
            }`
          : `列印失敗：\n${
              error instanceof Error ? error.message : String(error)
            }`
      );
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <View className={className}>
      <Button
        mode="contained"
        onPress={handlePrint}
        disabled={disabled || isPrinting}
        buttonColor={theme.colors.primary}
        textColor={theme.colors.onPrimary}
        loading={isPrinting}
        icon="printer"
      >
        {language === 'en' ? 'Print Summary' : '列印摘要'}
      </Button>
    </View>
  );
}

