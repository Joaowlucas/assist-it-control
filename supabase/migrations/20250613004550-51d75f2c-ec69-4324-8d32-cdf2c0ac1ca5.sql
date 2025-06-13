
-- Create equipment_requests table
CREATE TABLE public.equipment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES public.profiles(id) NOT NULL,
  equipment_type TEXT NOT NULL,
  specifications JSONB NOT NULL DEFAULT '{}',
  justification TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'entregue', 'cancelado')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on equipment_requests
ALTER TABLE public.equipment_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view their own equipment requests" 
  ON public.equipment_requests 
  FOR SELECT 
  USING (auth.uid() = requester_id);

-- Policy: Users can create their own requests
CREATE POLICY "Users can create equipment requests" 
  ON public.equipment_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = requester_id);

-- Policy: Users can update their own pending requests
CREATE POLICY "Users can update their own pending requests" 
  ON public.equipment_requests 
  FOR UPDATE 
  USING (auth.uid() = requester_id AND status = 'pendente');

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all equipment requests" 
  ON public.equipment_requests 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'technician')
    )
  );

-- Policy: Admins can update requests (for approval/rejection)
CREATE POLICY "Admins can update equipment requests" 
  ON public.equipment_requests 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'technician')
    )
  );

-- Add trigger to update updated_at column
CREATE TRIGGER update_equipment_requests_updated_at 
  BEFORE UPDATE ON public.equipment_requests 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
