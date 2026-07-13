import { RouterProvider } from "react-router-dom";
import { router } from "./app.routes";

import "./features/shared/style/global.scss";

import { AuthProvider } from "./features/auth/auth.context";
import { SongContextProvider } from "./features/home/song.context";
import ErrorBoundary from "./features/shared/components/ErrorBoundary";

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SongContextProvider>
          <RouterProvider router={router} />
        </SongContextProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;