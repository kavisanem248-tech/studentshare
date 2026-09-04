import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import {
  AdminPage,
  AuthPage,
  BrowsePage,
  DashboardPage,
  LandingPage,
  GroupsPage,
  MyUploadsPage,
  PdfViewerPage,
  ProfilePage,
  SubjectsPage,
  UploadPage,
} from "./pages/Home";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login"><AuthPage mode="login" /></Route>
      <Route path="/signup"><AuthPage mode="signup" /></Route>
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/subjects" component={SubjectsPage} />
      <Route path="/groups" component={GroupsPage} />
      <Route path="/browse" component={BrowsePage} />
      <Route path="/upload"><UploadPage /></Route>
      <Route path="/edit/:id">{params => <UploadPage editId={Number(params.id)} />}</Route>
      <Route path="/uploads" component={MyUploadsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/studentshare/pdf/:id" component={PdfViewerPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
