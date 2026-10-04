
import { QueryClientProvider } from "@tanstack/react-query";

import AppNavigator from "./src/navigation/AppNavigator";
import { queryClient } from "./src/lib/queryClient";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppNavigator />
    </QueryClientProvider>
  );
}
