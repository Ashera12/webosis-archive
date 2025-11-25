-- Fix member photos dengan valid placeholder avatars

UPDATE public.members 
SET foto_url = 'https://ui-avatars.com/api/?name=Ahmad+Fauzi&background=3B82F6&color=fff&size=400' 
WHERE nama = 'Ahmad Fauzi';

UPDATE public.members 
SET foto_url = 'https://ui-avatars.com/api/?name=Siti+Nurhaliza&background=EF4444&color=fff&size=400' 
WHERE nama = 'Siti Nurhaliza';

UPDATE public.members 
SET foto_url = 'https://ui-avatars.com/api/?name=Budi+Santoso&background=10B981&color=fff&size=400' 
WHERE nama = 'Budi Santoso';

UPDATE public.members 
SET foto_url = 'https://ui-avatars.com/api/?name=Rina+Wati&background=F59E0B&color=fff&size=400' 
WHERE nama = 'Rina Wati';

-- Verify
SELECT id, nama, foto_url FROM public.members;
