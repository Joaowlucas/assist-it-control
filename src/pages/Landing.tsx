
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Shield, Users, Wrench } from "lucide-react"
import { Link } from "react-router-dom"

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Sistema de Gestão
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            Gerencie chamados, equipamentos e atribuições de forma eficiente
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3">
              Acessar Sistema
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Seguro e Confiável</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Sistema robusto com controle de acesso e segurança avançada
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Wrench className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <CardTitle>Gestão Completa</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Controle total de equipamentos, chamados e atribuições
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Colaborativo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Interface intuitiva para diferentes tipos de usuários
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
