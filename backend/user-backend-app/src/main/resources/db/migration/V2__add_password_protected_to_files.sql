-- Ajout de la colonne password_protected à file_assets
alter table file_assets add column password_protected boolean not null default false;

