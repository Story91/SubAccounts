import '@radix-ui/react-tabs';

declare module '@radix-ui/react-tabs' {
  interface TabsListProps {
    className?: string;
  }

  interface TabsTriggerProps {
    className?: string;
  }

  interface TabsContentProps {
    className?: string;
  }
} 