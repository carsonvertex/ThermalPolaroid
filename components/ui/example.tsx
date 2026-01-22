/**
 * Example component demonstrating Gluestack UI usage
 * This file shows how to use various Gluestack UI components
 */

import {
    Badge,
    BadgeText,
    Box,
    Button,
    ButtonText,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Divider,
    Heading,
    HStack,
    Input,
    InputField,
    Spinner,
    Text,
    VStack,
} from '@/components/ui';
import React from 'react';

export function GluestackExample() {
  const [inputValue, setInputValue] = React.useState('');

  return (
    <VStack className="gap-4 p-4  dark:bg-gray-900">
      <Heading className="text-2xl">Gluestack UI Examples</Heading>
      
      {/* Text Examples */}
      <VStack className="gap-2">
        <Text className="text-lg font-bold">
          Typography
        </Text>
        <Text className="text-base">Regular text with medium size</Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Small text with lighter color
        </Text>
      </VStack>

      <Divider />

      {/* Button Examples */}
      <VStack className="gap-2">
        <Text className="text-lg font-bold">
          Buttons
        </Text>
        <HStack className="gap-2">
          <Button className="bg-blue-500 px-4 py-2 rounded-lg">
            <ButtonText className="text-white font-semibold">Primary</ButtonText>
          </Button>
          <Button className="border border-gray-300 px-4 py-2 rounded-lg">
            <ButtonText className="text-gray-700 font-semibold">Outline</ButtonText>
          </Button>
          <Button className="bg-transparent">
            <ButtonText className="text-blue-500 font-semibold">Link</ButtonText>
          </Button>
        </HStack>
      </VStack>

      <Divider />

      {/* Input Example */}
      <VStack className="gap-2">
        <Text className="text-lg font-bold">
          Input
        </Text>
        <Input className="border border-gray-300 rounded-lg">
          <InputField
            placeholder="Enter text here..."
            value={inputValue}
            onChangeText={setInputValue}
            className="p-3"
          />
        </Input>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Value: {inputValue}
        </Text>
      </VStack>

      <Divider />

      {/* Card Example */}
      <VStack className="gap-2">
        <Text className="text-lg font-bold">
          Card
        </Text>
        <Card className="border border-gray-200 rounded-lg">
          <CardHeader className="p-4 border-b border-gray-200">
            <Heading className="text-lg font-bold">Card Title</Heading>
          </CardHeader>
          <CardBody className="p-4">
            <Text>This is a card body with some content.</Text>
          </CardBody>
          <CardFooter className="p-4 border-t border-gray-200">
            <Button className="bg-transparent">
              <ButtonText className="text-blue-500 font-semibold">Action</ButtonText>
            </Button>
          </CardFooter>
        </Card>
      </VStack>

      <Divider />

      {/* Badge Examples */}
      <VStack className="gap-2">
        <Text className="text-lg font-bold">
          Badges
        </Text>
        <HStack className="gap-2">
          <Badge className="bg-green-100 px-3 py-1 rounded-full">
            <BadgeText className="text-green-800 text-xs font-semibold">Success</BadgeText>
          </Badge>
          <Badge className="bg-red-100 px-3 py-1 rounded-full">
            <BadgeText className="text-red-800 text-xs font-semibold">Error</BadgeText>
          </Badge>
          <Badge className="bg-yellow-100 px-3 py-1 rounded-full">
            <BadgeText className="text-yellow-800 text-xs font-semibold">Warning</BadgeText>
          </Badge>
          <Badge className="bg-blue-100 px-3 py-1 rounded-full">
            <BadgeText className="text-blue-800 text-xs font-semibold">Info</BadgeText>
          </Badge>
        </HStack>
      </VStack>

      <Divider />

      {/* Loading Example */}
      <VStack className="gap-2">
        <Text className="text-lg font-bold">
          Loading
        </Text>
        <HStack className="gap-2 items-center">
          <Spinner size="small" />
          <Text>Loading...</Text>
        </HStack>
      </VStack>

      <Divider />

      {/* Box with Styling */}
      <VStack className="gap-2">
        <Text className="text-lg font-bold">
          Styled Box
        </Text>
        <Box className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg border border-blue-300 dark:border-blue-700">
          <Text className="text-blue-900 dark:text-blue-100">
            This is a styled box with primary colors
          </Text>
        </Box>
      </VStack>
    </VStack>
  );
}

