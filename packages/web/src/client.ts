import { Client, makeMegawaveClient } from 'api/client';

export const client = makeMegawaveClient('/') as Client;
