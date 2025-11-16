import { Button } from "@/components/ui/button";
import { Phone, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 bg-background p-8">
      <header className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-foreground">
          EyeConnect
        </h1>
        <p className="text-2xl text-muted-foreground">
          Connecting those who need help with those who can see
        </p>
      </header>

      <main className="flex w-full max-w-4xl flex-col gap-8">
        <Button
          onClick={() => navigate("/help-request")}
          className="h-48 w-full text-3xl font-bold"
          aria-label="I need help - Request assistance from a sighted volunteer. Tap to request help from a volunteer who will video call you"
        >
          <Phone className="mr-4 h-16 w-16" aria-hidden="true" />
          I Need Help
        </Button>

        <Button
          onClick={() => navigate("/volunteer")}
          variant="secondary"
          className="h-48 w-full text-3xl font-bold"
          aria-label="I want to help - Become a volunteer to assist blind users. Tap to start helping blind users through video calls"
        >
          <Eye className="mr-4 h-16 w-16" aria-hidden="true" />
          I Want to Help
        </Button>
      </main>

      <footer className="text-center text-muted-foreground">
        <p className="text-lg">
          This app connects blind users with sighted volunteers through video calls
        </p>
      </footer>
    </div>
  );
};

export default Index;
