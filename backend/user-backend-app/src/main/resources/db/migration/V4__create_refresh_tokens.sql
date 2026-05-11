create table refresh_tokens (
    id varchar(36) not null primary key,
    user_id varchar(36) not null,
    token_hash varchar(64) not null,
    expires_at timestamp not null,
    created_at timestamp not null default current_timestamp,
    last_used_at timestamp null,
    revoked_at timestamp null,
    constraint uk_refresh_tokens_token_hash unique (token_hash),
    constraint fk_refresh_tokens_user foreign key (user_id) references users(id) on delete cascade
);

create index idx_refresh_tokens_user_id on refresh_tokens(user_id);

