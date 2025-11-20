import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import CustomFieldsSettings from "./settings/CustomFieldsSettings";
import ApiKeysSettings from "./settings/ApiKeysSettings";
import WebhooksSettings from "./settings/WebhooksSettings";

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "custom-fields";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as configurações do sistema
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="custom-fields">Campos Personalizados</TabsTrigger>
          <TabsTrigger value="api-keys">Chaves API</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="custom-fields" className="space-y-4">
          <CustomFieldsSettings />
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <ApiKeysSettings />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <WebhooksSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
