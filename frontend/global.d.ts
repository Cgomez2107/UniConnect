import type { FC } from "react";
import type {
  ViewProps,
  TextProps,
  TextInputProps,
  ScrollViewProps,
  ImageProps,
  FlatListProps,
} from "react-native";

declare module "react-native" {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface FlatListProps<ItemT> {
    className?: string;
  }
}

declare module "react-native-gesture-handler" {
  interface TouchableOpacityProps {
    className?: string;
  }
  interface TouchableHighlightProps {
    className?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
}

declare module "react-native-screens" {
  interface ScreenProps {
    className?: string;
  }
}