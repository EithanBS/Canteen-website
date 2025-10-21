import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import PinDialog from '@/components/PinDialog';

const TransferSection = () => {
  const { user } = useAuth();
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .neq('id', user?.id);
      
      if (error) throw error;
      return data;
    },
  });

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

  const handleTransfer = async (pin: string) => {
    const transferAmount = parseFloat(amount);
    
    if (!recipientId || isNaN(transferAmount) || transferAmount <= 0) {
      toast.error('Please fill in all fields with valid values');
      return;
    }

    if (parseFloat(wallet?.balance || '0') < transferAmount) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      // Verify PIN
      const { data: pinCheck } = await supabase.rpc('verify_pin', {
        user_id: user?.id,
        input_pin: pin,
      });

      if (!pinCheck) {
        toast.error('Invalid PIN!');
        return;
      }

      // Get recipient wallet
      const { data: recipientWallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', recipientId)
        .single();

      if (!recipientWallet) {
        toast.error('Recipient wallet not found');
        return;
      }

      // Update sender balance
      await supabase
        .from('wallets')
        .update({ balance: parseFloat(wallet?.balance || '0') - transferAmount })
        .eq('user_id', user?.id);

      // Update recipient balance
      await supabase
        .from('wallets')
        .update({ balance: parseFloat(recipientWallet.balance) + transferAmount })
        .eq('user_id', recipientId);

      // Create transaction record
      await supabase.from('transactions').insert({
        from_user_id: user?.id,
        to_user_id: recipientId,
        amount: transferAmount,
        type: 'transfer',
        status: 'completed',
      });

      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transfer successful!');
      setAmount('');
      setRecipientId('');
      setShowPinDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Transfer failed');
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-heading text-glow mb-6">TRANSFER MONEY</h2>
      
      <Card className="card-glow border-glow max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Send Money to Another Student</CardTitle>
          <CardDescription>Transfer funds securely using your PIN</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Select value={recipientId} onValueChange={setRecipientId}>
              <SelectTrigger id="recipient">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.full_name || student.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Amount</Label>
            <Input
              id="transfer-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div className="p-4 bg-muted/20 rounded-lg border border-primary/30">
            <p className="text-sm text-muted-foreground">Your Balance</p>
            <p className="text-2xl font-heading text-primary">
              ₱{parseFloat(wallet?.balance || '0').toFixed(2)}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => setShowPinDialog(true)}
            disabled={!recipientId || !amount}
            className="w-full gap-2"
          >
            <Send className="h-4 w-4" />
            Send Money
          </Button>
        </CardFooter>
      </Card>

      <PinDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onConfirm={handleTransfer}
        title="Confirm Transfer"
        description="Enter your PIN to complete the transfer"
      />
    </div>
  );
};

export default TransferSection;
