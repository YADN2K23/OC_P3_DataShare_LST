create table users (
    id varchar(36) not null primary key,
    login varchar(255) not null,
    password_hash varchar(255) not null,
    created_at timestamp not null default current_timestamp,
    constraint uk_users_login unique (login)
);

create table file_assets (
    id varchar(36) not null primary key,
    owner_id varchar(36) not null,
    original_name varchar(255) not null,
    storage_path varchar(1024) not null,
    size_bytes bigint not null,
    content_type varchar(255) not null,
    created_at timestamp not null default current_timestamp,
    constraint fk_file_assets_owner foreign key (owner_id) references users(id) on delete cascade
);

create index idx_file_assets_owner_id on file_assets(owner_id);

create table share_links (
    id varchar(36) not null primary key,
    file_id varchar(36) not null,
    token varchar(255) not null,
    expires_at timestamp not null,
    created_at timestamp not null default current_timestamp,
    constraint uk_share_links_token unique (token),
    constraint fk_share_links_file foreign key (file_id) references file_assets(id) on delete cascade
);

create index idx_share_links_file_id on share_links(file_id);


