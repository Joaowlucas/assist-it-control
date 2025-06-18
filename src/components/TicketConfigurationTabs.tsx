
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TicketCategoriesManagement } from "./TicketCategoriesManagement"
import { PredefinedTextsManagement } from "./PredefinedTextsManagement"
import { TicketTemplateManagement } from "./TicketTemplateManagement"

export function TicketConfigurationTabs() {
  return (
    <Tabs defaultValue="categories" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="categories">Categorias</TabsTrigger>
        <TabsTrigger value="texts">Textos Pré-definidos</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
      </TabsList>
      
      <TabsContent value="categories" className="space-y-4">
        <TicketCategoriesManagement />
      </TabsContent>
      
      <TabsContent value="texts" className="space-y-4">
        <PredefinedTextsManagement />
      </TabsContent>
      
      <TabsContent value="templates" className="space-y-4">
        <TicketTemplateManagement />
      </TabsContent>
    </Tabs>
  )
}
