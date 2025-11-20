import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { ArrowLeft, UtensilsCrossed, Gift, Calendar, Mail, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  buyer_email: string;
  buyer_note: string | null;
  item_price: number;
  service_fee: number;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  food_items: {
    name: string;
  } | null;
}

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    fetchTransactions(session.user.id);
  };

  const fetchTransactions = async (userId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        food_items:food_item_id (name)
      `)
      .eq("recipient_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load transaction history");
      console.error(error);
    } else {
      setTransactions(data || []);
    }
    setIsLoading(false);
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      USD: "$", EUR: "€", GBP: "£", NGN: "₦"
    };
    return symbols[currency] || "$";
  };

  const getTotalReceived = () => {
    return transactions.reduce((sum, tx) => sum + tx.item_price, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <UtensilsCrossed className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Transaction History
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Summary Card */}
        <Card className="mb-8 shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Summary
            </CardTitle>
            <CardDescription>Your received gifts overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Gifts Received</p>
                <p className="text-3xl font-bold text-foreground">{transactions.length}</p>
              </div>
              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Value Received</p>
                <p className="text-3xl font-bold text-foreground">
                  {getCurrencySymbol(transactions[0]?.currency || "USD")}
                  {getTotalReceived().toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <Card className="shadow-medium">
            <CardContent className="py-12 text-center">
              <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No transactions yet</h3>
              <p className="text-muted-foreground mb-6">
                When someone buys you a gift, it will appear here.
              </p>
              <Button onClick={() => navigate("/dashboard")} className="bg-gradient-hero">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">All Transactions</h2>
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            {transaction.food_items?.name || "Gift Item"}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {transaction.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {getCurrencySymbol(transaction.currency)}
                            {transaction.item_price.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            +{getCurrencySymbol(transaction.currency)}
                            {transaction.service_fee.toFixed(2)} service fee
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="font-medium">From:</span>
                          <span>{transaction.buyer_email}</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Date:</span>
                          <span>{format(new Date(transaction.created_at), "PPP 'at' p")}</span>
                        </div>

                        {transaction.buyer_note && (
                          <div className="flex items-start gap-2 mt-3 p-3 bg-secondary/50 rounded-lg">
                            <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm mb-1">Message:</p>
                              <p className="text-sm text-foreground italic">"{transaction.buyer_note}"</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TransactionHistory;
