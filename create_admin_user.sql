-- Script pour créer un utilisateur Super Admin
-- À exécuter dans le SQL Editor de Supabase

-- 1. D'abord, créez l'utilisateur dans Supabase Auth via le Dashboard
--    (Authentication → Users → Add user)
--    Email: admin@example.com
--    Password: VotreMotDePasseSecurise123!

-- 2. Récupérez l'auth_id de l'utilisateur créé
-- SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- 3. Mettez à jour l'utilisateur pour en faire un super_admin
-- Remplacez 'auth-id-de-l-utilisateur' par l'ID récupéré à l'étape 2
UPDATE public.users 
SET user_type = 'super_admin'
WHERE email = 'admin@example.com';

-- 4. Vérifiez que l'utilisateur a bien été mis à jour
SELECT id, email, user_type, is_active, created_at 
FROM public.users 
WHERE email = 'admin@example.com';

-- Alternative : Si le trigger n'a pas créé l'utilisateur automatiquement
-- Récupérez d'abord l'auth_id
-- SELECT id FROM auth.users WHERE email = 'admin@example.com';

-- Puis créez manuellement l'entrée dans users
/*
INSERT INTO public.users (email, auth_id, user_type, is_active, created_at)
VALUES (
  'admin@example.com',
  'REMPLACER-PAR-AUTH-ID',
  'super_admin',
  true,
  now()
);
*/

