"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Package, ShoppingCart, Users, Plus, Settings, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AdminDashboardProps {
  initialData?: any
}

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const router = useRouter()
  const [data, setData] = React.useState(initialData || {
    products: 0,
    orders: 0,
    users: 0,
    recentOrders: [],
  })
  const [loading, setLoading] = React.useState(!initialData)

  React.useEffect(() => {
    if (!initialData) {
      fetchAdminData()
    }
  }, [initialData])

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/ecommerce/admin")
      
      if (!response.ok) {
        throw new Error("Failed to fetch admin data")
      }
      
      const data = await response.json()
      setData(data)
    } catch (error) {
      console.error("Error fetching admin data:", error)
      toast.error("Failed to load admin dashboard data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <Button onClick={() => router.push("/module/ecommerce/admin/products/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.products}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.orders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Overview</CardTitle>
              <CardDescription>
                Manage your e-commerce store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button 
                  variant="outline" 
                  className="h-20 justify-start" 
                  onClick={() => router.push("/module/ecommerce/admin/products")}
                >
                  <Package className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Manage Products</div>
                    <div className="text-xs text-muted-foreground">
                      Add, edit or remove products
                    </div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 justify-start"
                  onClick={() => router.push("/module/ecommerce/admin/orders")}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Manage Orders</div>
                    <div className="text-xs text-muted-foreground">
                      View and update order status
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                Orders placed recently
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentOrders && data.recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {data.recentOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b pb-4"
                    >
                      <div>
                        <p className="font-medium">{order.user.name || order.user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Order #{order.id.slice(0, 8)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${order.total.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          Status: {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground">No recent orders found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Store Settings</CardTitle>
              <CardDescription>
                Configure your store settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Store settings are coming soon</p>
                  <p className="text-sm text-muted-foreground">
                    Store configuration options will be available in a future update
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}