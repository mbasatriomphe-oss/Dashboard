"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileSpreadsheet,
  Download,
  Printer,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  ArrowUpDown,
  BarChart3,
  History,
  FileText,
} from "lucide-react"
import { products } from "../../data/products"

// Generate comprehensive stock data
const generateStockData = () => {
  return products.map((product, index) => {
    const currentStock = Math.floor(Math.random() * 150) + 5
    const minStock = 10
    const maxStock = 150
    const costPrice = product.price * 0.6
    const movements = []
    
    // Generate random movements for the last 30 days
    for (let i = 0; i < 10; i++) {
      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * 30))
      const type = Math.random() > 0.3 ? "sale" : "restock"
      const quantity = type === "sale" 
        ? Math.floor(Math.random() * 10) + 1 
        : Math.floor(Math.random() * 50) + 10
      movements.push({
        date: date.toISOString().split("T")[0],
        type,
        quantity,
        balance: currentStock + (type === "sale" ? quantity : -quantity),
      })
    }
    
    return {
      ...product,
      sku: `SKU-${String(index + 1).padStart(4, "0")}`,
      currentStock,
      minStock,
      maxStock,
      costPrice,
      totalValue: currentStock * costPrice,
      retailValue: currentStock * product.price,
      supplier: ["Supplier A", "Supplier B", "Supplier C"][Math.floor(Math.random() * 3)],
      lastRestock: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      movements: movements.sort((a, b) => new Date(b.date) - new Date(a.date)),
      salesLast30Days: Math.floor(Math.random() * 100) + 10,
      restocksLast30Days: Math.floor(Math.random() * 3) + 1,
    }
  })
}

// Restock history data
const RESTOCK_HISTORY = [
  {
    id: "RS001",
    date: "2024-01-17",
    products: [
      { name: "Cheeseburger", sku: "SKU-0001", quantity: 50, cost: 5.39 },
      { name: "French Fries", sku: "SKU-0005", quantity: 100, cost: 2.39 },
    ],
    totalCost: 509.00,
    supplier: "Supplier A",
    status: "completed",
    processedBy: "Admin",
  },
  {
    id: "RS002",
    date: "2024-01-15",
    products: [
      { name: "Coca Cola", sku: "SKU-0006", quantity: 200, cost: 1.49 },
      { name: "Iced Tea", sku: "SKU-0007", quantity: 150, cost: 1.79 },
    ],
    totalCost: 566.50,
    supplier: "Supplier B",
    status: "completed",
    processedBy: "Admin",
  },
  {
    id: "RS003",
    date: "2024-01-12",
    products: [
      { name: "Chocolate Cake", sku: "SKU-0011", quantity: 30, cost: 3.59 },
    ],
    totalCost: 107.70,
    supplier: "Supplier C",
    status: "completed",
    processedBy: "Admin",
  },
]

export default function StockReportsPage() {
  const [stockData] = useState(() => generateStockData())
  const [selectedReport, setSelectedReport] = useState("sheet")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [dateRange, setDateRange] = useState("30")
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Calculate totals
  const totals = useMemo(() => {
    const filtered = stockData.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false
      if (stockFilter === "low" && p.currentStock > p.minStock) return false
      if (stockFilter === "out" && p.currentStock > 0) return false
      if (stockFilter === "ok" && p.currentStock <= p.minStock) return false
      return true
    })

    return {
      totalProducts: filtered.length,
      totalStock: filtered.reduce((sum, p) => sum + p.currentStock, 0),
      totalCostValue: filtered.reduce((sum, p) => sum + p.totalValue, 0),
      totalRetailValue: filtered.reduce((sum, p) => sum + p.retailValue, 0),
      lowStockItems: filtered.filter((p) => p.currentStock <= p.minStock).length,
      outOfStockItems: filtered.filter((p) => p.currentStock === 0).length,
    }
  }, [stockData, categoryFilter, stockFilter])

  // Filter and sort
  const filteredData = useMemo(() => {
    let result = [...stockData]

    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category === categoryFilter)
    }

    if (stockFilter === "low") {
      result = result.filter((p) => p.currentStock <= p.minStock && p.currentStock > 0)
    } else if (stockFilter === "out") {
      result = result.filter((p) => p.currentStock === 0)
    } else if (stockFilter === "ok") {
      result = result.filter((p) => p.currentStock > p.minStock)
    }

    result.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1
      }
      return aVal < bVal ? 1 : -1
    })

    return result
  }, [stockData, categoryFilter, stockFilter, sortBy, sortOrder])

  const getStockBadge = (product) => {
    if (product.currentStock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    if (product.currentStock <= product.minStock) {
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Low Stock</Badge>
    }
    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">OK</Badge>
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"
    
    if (selectedReport === "sheet") {
      csvContent += "SKU,Product,Category,Current Stock,Min Stock,Cost Price,Total Value,Status\n"
      filteredData.forEach((p) => {
        csvContent += `${p.sku},${p.name},${p.category},${p.currentStock},${p.minStock},${p.costPrice.toFixed(2)},${p.totalValue.toFixed(2)},${p.currentStock <= p.minStock ? "Low" : "OK"}\n`
      })
    } else if (selectedReport === "valuation") {
      csvContent += "SKU,Product,Category,Quantity,Cost Price,Retail Price,Cost Value,Retail Value\n"
      filteredData.forEach((p) => {
        csvContent += `${p.sku},${p.name},${p.category},${p.currentStock},${p.costPrice.toFixed(2)},${p.price.toFixed(2)},${p.totalValue.toFixed(2)},${p.retailValue.toFixed(2)}\n`
      })
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `stock_report_${selectedReport}_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive stock sheets and inventory reports
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">Products</p>
                <p className="text-xl font-bold text-foreground">{totals.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground">Total Stock</p>
                <p className="text-xl font-bold text-foreground">{totals.totalStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-xs text-muted-foreground">Cost Value</p>
                <p className="text-xl font-bold text-foreground">${totals.totalCostValue.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <div>
                <p className="text-xs text-muted-foreground">Retail Value</p>
                <p className="text-xl font-bold text-foreground">${totals.totalRetailValue.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs text-muted-foreground">Low Stock</p>
                <p className="text-xl font-bold text-foreground">{totals.lowStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-xs text-muted-foreground">Out of Stock</p>
                <p className="text-xl font-bold text-foreground">{totals.outOfStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs value={selectedReport} onValueChange={setSelectedReport} className="space-y-4">
        <TabsList className="print:hidden">
          <TabsTrigger value="sheet">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Stock Sheet
          </TabsTrigger>
          <TabsTrigger value="movements">
            <History className="h-4 w-4 mr-2" />
            Stock Movements
          </TabsTrigger>
          <TabsTrigger value="lowstock">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Low Stock Alerts
          </TabsTrigger>
          <TabsTrigger value="valuation">
            <DollarSign className="h-4 w-4 mr-2" />
            Stock Valuation
          </TabsTrigger>
          <TabsTrigger value="restock-history">
            <FileText className="h-4 w-4 mr-2" />
            Restock History
          </TabsTrigger>
        </TabsList>

        {/* Filters - shared across tabs */}
        <Card className="print:hidden">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="drinks">Drinks</SelectItem>
                  <SelectItem value="desserts">Desserts</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Stock Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                  <SelectItem value="ok">In Stock</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stock Sheet Report */}
        <TabsContent value="sheet">
          <Card>
            <CardHeader>
              <CardTitle>Stock Sheet</CardTitle>
              <CardDescription>
                Complete inventory list with current stock levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Current Stock</TableHead>
                      <TableHead className="text-center">Min Stock</TableHead>
                      <TableHead className="text-center">Max Stock</TableHead>
                      <TableHead className="text-right">Cost Price</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Restock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                        <TableCell className="capitalize">{product.category}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${
                            product.currentStock <= product.minStock
                              ? "text-amber-600"
                              : "text-foreground"
                          }`}>
                            {product.currentStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{product.minStock}</TableCell>
                        <TableCell className="text-center">{product.maxStock}</TableCell>
                        <TableCell className="text-right">${product.costPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">${product.totalValue.toFixed(2)}</TableCell>
                        <TableCell>{getStockBadge(product)}</TableCell>
                        <TableCell>{product.lastRestock}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals Row */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Totals:</span>
                  <div className="flex gap-8">
                    <div>
                      <span className="text-muted-foreground">Total Items: </span>
                      <span className="font-bold text-foreground">{totals.totalStock}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Value: </span>
                      <span className="font-bold text-foreground">${totals.totalCostValue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Movements Report */}
        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movements</CardTitle>
              <CardDescription>Track all inventory ins and outs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() =>
                        setSelectedProduct(
                          selectedProduct === product.id ? null : product.id
                        )
                      }
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.sku}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Last {dateRange} Days</p>
                          <div className="flex gap-2">
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              -{product.salesLast30Days} sales
                            </Badge>
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              +{product.restocksLast30Days} restocks
                            </Badge>
                          </div>
                        </div>
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    {selectedProduct === product.id && (
                      <div className="mt-4 border-t pt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {product.movements.slice(0, 5).map((movement, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{movement.date}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      movement.type === "sale"
                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    }
                                  >
                                    {movement.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {movement.type === "sale" ? "-" : "+"}
                                  {movement.quantity}
                                </TableCell>
                                <TableCell className="text-right">{movement.balance}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock Alerts */}
        <TabsContent value="lowstock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>Products that need restocking attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockData
                  .filter((p) => p.currentStock <= p.minStock)
                  .sort((a, b) => a.currentStock - b.currentStock)
                  .map((product) => (
                    <div
                      key={product.id}
                      className={`p-4 rounded-lg border-2 ${
                        product.currentStock === 0
                          ? "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
                          : "border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-semibold text-foreground">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.sku} | {product.supplier}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            product.currentStock === 0 ? "text-red-600" : "text-amber-600"
                          }`}>
                            {product.currentStock}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            of {product.minStock} min
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Suggested Order</p>
                          <p className="text-lg font-bold text-foreground">
                            {product.maxStock - product.currentStock}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                {stockData.filter((p) => p.currentStock <= p.minStock).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No low stock alerts. All products are well stocked.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Valuation Report */}
        <TabsContent value="valuation">
          <Card>
            <CardHeader>
              <CardTitle>Stock Valuation Report</CardTitle>
              <CardDescription>Financial value of current inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Cost Price</TableHead>
                      <TableHead className="text-right">Retail Price</TableHead>
                      <TableHead className="text-right">Cost Value</TableHead>
                      <TableHead className="text-right">Retail Value</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((product) => {
                      const margin = ((product.price - product.costPrice) / product.price) * 100
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                          <TableCell className="capitalize">{product.category}</TableCell>
                          <TableCell className="text-center">{product.currentStock}</TableCell>
                          <TableCell className="text-right">${product.costPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${product.totalValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${product.retailValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              {margin.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Valuation Summary */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Cost Value</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${totals.totalCostValue.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Retail Value</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${totals.totalRetailValue.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Potential Profit</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      ${(totals.totalRetailValue - totals.totalCostValue).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Restock History Report */}
        <TabsContent value="restock-history">
          <Card>
            <CardHeader>
              <CardTitle>Restock History</CardTitle>
              <CardDescription>Record of all restocking activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {RESTOCK_HISTORY.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">Order #{entry.id}</p>
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {entry.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {entry.date} | {entry.supplier} | Processed by: {entry.processedBy}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-xl font-bold text-foreground">${entry.totalCost.toFixed(2)}</p>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entry.products.map((product, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                            <TableCell>{product.name}</TableCell>
                            <TableCell className="text-right">{product.quantity}</TableCell>
                            <TableCell className="text-right">${product.cost.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">
                              ${(product.quantity * product.cost).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Header - only visible when printing */}
      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-bold">Stock Report</h1>
        <p className="text-sm">Generated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  )
}
