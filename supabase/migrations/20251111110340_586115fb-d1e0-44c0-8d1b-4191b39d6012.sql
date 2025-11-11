-- Create messages table for WhatsApp and Email
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'email')),
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  message_id TEXT,
  thread_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create replies table
CREATE TABLE public.replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  tone TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence DECIMAL(3,2),
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create metrics table
CREATE TABLE public.metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'email')),
  accuracy DECIMAL(5,2),
  precision_score DECIMAL(5,2),
  recall_score DECIMAL(5,2),
  f1_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for replies
CREATE POLICY "Users can view replies to their messages" 
ON public.replies 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.messages 
  WHERE messages.id = replies.message_id 
  AND messages.user_id = auth.uid()
));

CREATE POLICY "Users can create replies to their messages" 
ON public.replies 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.messages 
  WHERE messages.id = replies.message_id 
  AND messages.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own replies" 
ON public.replies 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.messages 
  WHERE messages.id = replies.message_id 
  AND messages.user_id = auth.uid()
));

-- Create policies for metrics
CREATE POLICY "Users can view their own metrics" 
ON public.metrics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own metrics" 
ON public.metrics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.replies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.metrics;