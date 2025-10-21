import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const WalletSection = () => {
  const { user } = useAuth();
  const [topupAmount, setTopupAmount] = useState('');
  const [showQRIS, setShowQRIS] = useState(false);
  const queryClient = useQueryClient();

  const { data: wallet } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`from_user_id.eq.${user?.id},to_user_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const handleTopup = () => {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setShowQRIS(true);
  };

  const confirmTopup = async () => {
    const amount = parseFloat(topupAmount);
    
    try {
      // Update balance
      const newBalance = parseFloat(wallet?.balance || '0') + amount;
      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', user?.id);

      // Create transaction record
      await supabase.from('transactions').insert({
        from_user_id: user?.id,
        amount: amount,
        type: 'topup',
        status: 'completed',
      });

      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Top-up successful!');
      setTopupAmount('');
      setShowQRIS(false);
    } catch (error: any) {
      toast.error(error.message || 'Top-up failed');
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-heading text-glow mb-6">E-WALLET</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Balance Card */}
        <Card className="card-glow border-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-heading text-glow">
              ₱{parseFloat(wallet?.balance || '0').toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Top-up Card */}
        <Card className="card-glow border-glow">
          <CardHeader>
            <CardTitle>Top Up Wallet</CardTitle>
            <CardDescription>Add funds using QRIS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topup-amount">Amount</Label>
              <Input
                id="topup-amount"
                type="number"
                placeholder="0.00"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleTopup} className="w-full gap-2">
              <QrCode className="h-4 w-4" />
              Top Up via QRIS
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="mt-6 card-glow">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions?.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium">
                    {tx.type === 'topup' && 'Top Up'}
                    {tx.type === 'transfer' && (tx.from_user_id === user?.id ? 'Transfer Out' : 'Transfer In')}
                    {tx.type === 'order' && 'Order Payment'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
                <div className={`font-heading text-lg ${
                  tx.from_user_id === user?.id && tx.type !== 'topup' ? 'text-destructive' : 'text-primary'
                }`}>
                  {tx.from_user_id === user?.id && tx.type !== 'topup' ? '-' : '+'}₱{parseFloat(tx.amount).toFixed(2)}
                </div>
              </div>
            ))}
            {!transactions?.length && (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QRIS Dialog */}
      <Dialog open={showQRIS} onOpenChange={setShowQRIS}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QRIS Payment</DialogTitle>
            <DialogDescription>
              Scan the QR code below to complete your top-up of ₱{parseFloat(topupAmount || '0').toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-64 h-64 bg-muted/20 border-2 border-primary rounded-lg flex items-center justify-center">
              <QrCode className="h-32 w-32 text-primary" />
              <p className="absolute text-sm text-muted-foreground mt-48">QR Code Placeholder</p>
            </div>
            <Button onClick={confirmTopup} className="w-full">
              Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletSection;
