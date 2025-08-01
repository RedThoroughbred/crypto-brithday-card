--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18
-- Dumped by pg_dump version 14.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: chainstatus; Type: TYPE; Schema: public; Owner: geogift
--

CREATE TYPE public.chainstatus AS ENUM (
    'ACTIVE',
    'COMPLETED',
    'EXPIRED',
    'CANCELLED'
);


ALTER TYPE public.chainstatus OWNER TO geogift;

--
-- Name: giftstatus; Type: TYPE; Schema: public; Owner: geogift
--

CREATE TYPE public.giftstatus AS ENUM (
    'PENDING',
    'CLAIMED',
    'EXPIRED'
);


ALTER TYPE public.giftstatus OWNER TO geogift;

--
-- Name: unlocktype; Type: TYPE; Schema: public; Owner: geogift
--

CREATE TYPE public.unlocktype AS ENUM (
    'GPS',
    'VIDEO',
    'IMAGE',
    'MARKDOWN',
    'QUIZ',
    'PASSWORD',
    'URL'
);


ALTER TYPE public.unlocktype OWNER TO geogift;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: geogift
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO geogift;

--
-- Name: chain_claims; Type: TABLE; Schema: public; Owner: geogift
--

CREATE TABLE public.chain_claims (
    id uuid NOT NULL,
    chain_id uuid NOT NULL,
    step_id uuid NOT NULL,
    claimer_address character varying NOT NULL,
    claim_lat double precision,
    claim_lng double precision,
    claim_data json,
    claim_tx_hash character varying NOT NULL,
    claim_block_number integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chain_claims OWNER TO geogift;

--
-- Name: chain_steps; Type: TABLE; Schema: public; Owner: geogift
--

CREATE TABLE public.chain_steps (
    id uuid NOT NULL,
    chain_id uuid NOT NULL,
    step_index integer NOT NULL,
    unlock_type public.unlocktype DEFAULT 'GPS'::public.unlocktype NOT NULL,
    latitude double precision,
    longitude double precision,
    radius integer,
    unlock_data json,
    clue_hash character varying,
    is_completed boolean,
    is_unlocked boolean,
    step_title character varying NOT NULL,
    step_message text,
    step_value character varying NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    reward_content text,
    reward_content_type character varying(50)
);


ALTER TABLE public.chain_steps OWNER TO geogift;

--
-- Name: gift_chains; Type: TABLE; Schema: public; Owner: geogift
--

CREATE TABLE public.gift_chains (
    id uuid NOT NULL,
    chain_id character varying NOT NULL,
    creator_id uuid NOT NULL,
    recipient_address character varying NOT NULL,
    total_value character varying NOT NULL,
    total_steps integer NOT NULL,
    current_step integer,
    status public.chainstatus NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    creation_tx_hash character varying NOT NULL,
    creation_block_number bigint,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    giver_address character varying NOT NULL,
    recipient_email character varying,
    chain_title character varying NOT NULL,
    chain_description text,
    is_completed boolean NOT NULL,
    is_expired boolean NOT NULL,
    expiry_date timestamp with time zone NOT NULL,
    blockchain_chain_id bigint,
    transaction_hash character varying,
    completed_at timestamp with time zone
);


ALTER TABLE public.gift_chains OWNER TO geogift;

--
-- Name: gifts; Type: TABLE; Schema: public; Owner: geogift
--

CREATE TABLE public.gifts (
    id uuid NOT NULL,
    sender_id uuid NOT NULL,
    recipient_address character varying NOT NULL,
    escrow_id character varying NOT NULL,
    lat double precision NOT NULL,
    lon double precision NOT NULL,
    message character varying,
    status public.giftstatus NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    unlock_type public.unlocktype DEFAULT 'GPS'::public.unlocktype NOT NULL,
    unlock_challenge_data text,
    reward_content text,
    reward_content_type character varying(50)
);


ALTER TABLE public.gifts OWNER TO geogift;

--
-- Name: users; Type: TABLE; Schema: public; Owner: geogift
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    wallet_address character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    display_name character varying(100),
    bio text,
    favorite_location character varying(200),
    is_public_profile boolean DEFAULT false NOT NULL,
    email_notifications boolean DEFAULT true NOT NULL,
    gift_notifications boolean DEFAULT true NOT NULL,
    marketing_emails boolean DEFAULT false NOT NULL,
    total_gifts_created integer DEFAULT 0 NOT NULL,
    total_gifts_claimed integer DEFAULT 0 NOT NULL,
    total_chains_created integer DEFAULT 0 NOT NULL,
    first_gift_created_at timestamp with time zone,
    first_gift_claimed_at timestamp with time zone,
    last_activity_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO geogift;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: geogift
--

COPY public.alembic_version (version_num) FROM stdin;
06211e21653f
\.


--
-- Data for Name: chain_claims; Type: TABLE DATA; Schema: public; Owner: geogift
--

COPY public.chain_claims (id, chain_id, step_id, claimer_address, claim_lat, claim_lng, claim_data, claim_tx_hash, claim_block_number, created_at) FROM stdin;
\.


--
-- Data for Name: chain_steps; Type: TABLE DATA; Schema: public; Owner: geogift
--

COPY public.chain_steps (id, chain_id, step_index, unlock_type, latitude, longitude, radius, unlock_data, clue_hash, is_completed, is_unlocked, step_title, step_message, step_value, completed_at, created_at, reward_content, reward_content_type) FROM stdin;
4c5afbc3-924a-4f1f-ad99-fada9959da7b	50ea9a1c-dc45-42e8-911d-a6ba11811360	0	GPS	40.7831	-73.9712	50	null		f	f	First Treasure	Find the hidden gem in Central Park	50	\N	2025-07-29 18:21:57.372542+00	\N	\N
75981e16-4826-4f50-98ed-331c7d5b9c52	50ea9a1c-dc45-42e8-911d-a6ba11811360	1	GPS	40.758	-73.9855	100	null		f	f	Final Prize	Complete the adventure at Times Square	50	\N	2025-07-29 18:21:57.372542+00	\N	\N
f00a7504-b4ca-4eb3-9040-8c3bef3e3b51	936825b2-6aeb-45f1-bab8-70a79b3343e6	0	GPS	40.7831	-73.9712	50	null		f	f	First Treasure	Find the hidden gem in Central Park	50	\N	2025-07-29 18:21:57.372542+00	\N	\N
499f1aa2-57c6-4473-9a0c-9fc35613fbfc	936825b2-6aeb-45f1-bab8-70a79b3343e6	1	GPS	40.758	-73.9855	100	null		f	f	Final Prize	Complete the adventure at Times Square	50	\N	2025-07-29 18:21:57.372542+00	\N	\N
bf0f9f67-71ca-428a-bbab-f7ac3372dcee	742bf665-1f51-4908-b773-a6679768fcfc	0	GPS	40.7831	-73.9712	50	null		f	f	First Treasure	Find the hidden gem in Central Park	50	\N	2025-07-29 18:22:12.942545+00	\N	\N
0459ca35-79d2-40e8-96aa-93cd6bfdf0b2	742bf665-1f51-4908-b773-a6679768fcfc	1	GPS	40.758	-73.9855	100	null		f	f	Final Prize	Complete the adventure at Times Square	50	\N	2025-07-29 18:22:12.942545+00	\N	\N
5cb8ba7a-0aa4-4c9b-9097-ed85020dc94e	d3780fde-40c9-4aac-b8fe-58aab79233e4	0	GPS	40.7831	-73.9712	50	null		f	f	First Treasure	Find the hidden gem in Central Park	50	\N	2025-07-29 18:23:11.821112+00	\N	\N
c0d10def-e58e-49ce-a8c4-6247e5df7624	d3780fde-40c9-4aac-b8fe-58aab79233e4	1	GPS	40.758	-73.9855	100	null		f	f	Final Prize	Complete the adventure at Times Square	50	\N	2025-07-29 18:23:11.821112+00	\N	\N
6f5e3d72-ae60-437b-8e7c-dd4e2c5b9a46	6aa88155-5225-40ca-b28a-b68432ea1dd3	0	GPS	40.7831	-73.9712	50	null		f	f	First Treasure	Find the hidden gem in Central Park	50	\N	2025-07-29 18:23:40.660882+00	\N	\N
c9dad981-9727-4d5c-ab83-8792a87811b5	6aa88155-5225-40ca-b28a-b68432ea1dd3	1	GPS	40.758	-73.9855	100	null		f	f	Final Prize	Complete the adventure at Times Square	50	\N	2025-07-29 18:23:40.660882+00	\N	\N
a0bd5b82-e0d5-43d4-88a0-9b9987595fb8	c325b457-d2a2-4c22-bb24-c46313e492de	0	PASSWORD	\N	\N	50	{"password": "Nicholaus86!", "passwordHint": "name"}		f	f	guess	Your first clue...middle	0.2835	\N	2025-07-30 02:01:52.704829+00	\N	\N
9c9cc320-1705-4d9d-a5a0-c25883cc5fa6	c325b457-d2a2-4c22-bb24-c46313e492de	1	GPS	38.87966115740447	-84.61655303847043	50	{"latitude": 38.87966115740447, "longitude": -84.61655303847043}		f	f	Step 2	The journey continues...close to you	0.2835	\N	2025-07-30 02:01:52.704829+00	\N	\N
a22f1816-5fa7-4d42-aba1-c001e93b79d6	d6f10c3f-9d8f-4d76-b004-fe2b8ecfd0e8	0	PASSWORD	\N	\N	50	{"password": "Nicholaus86!", "passwordHint": "name"}		f	f	Step 1	Your first clue...middle	0.2835	\N	2025-07-30 02:04:15.707174+00	\N	\N
e8a1b8f8-44dd-4956-8a7d-529985af439c	d6f10c3f-9d8f-4d76-b004-fe2b8ecfd0e8	1	GPS	38.87973196551158	-84.61675170445513	50	{"latitude": 38.87973192618122, "longitude": -84.61675173823659}		f	f	Step 2	The journey continues...near you!	0.2835	\N	2025-07-30 02:04:15.707174+00	\N	\N
ff3bde59-0783-4bb7-8eeb-9792f276c723	f4a458fe-ce15-4e0b-8c07-65313296a061	0	GPS	38.879575406747904	-84.61673769847368	50	{"latitude": 38.879575406747904, "longitude": -84.61673769847368}		f	f	Step 1	Your first clue...close by	0.273000000000000020	\N	2025-07-30 03:51:26.406613+00	\N	\N
a668d492-4ed2-4574-a0d1-b105b7534479	f4a458fe-ce15-4e0b-8c07-65313296a061	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name"}		f	f	Step 2	The journey continues...	0.273000000000000020	\N	2025-07-30 03:51:26.406613+00	\N	\N
dc964c21-82a4-45e3-a7cd-4d76398de9ab	7f2b6227-af62-468c-9302-fcc4aa0a1c0f	0	GPS	38.879498580826656	-84.61646539724417	50	{"latitude": 38.879498580826656, "longitude": -84.61646539724417}		f	f	Step 1	Your first clue...	0.225000000000000006	\N	2025-07-30 03:59:26.825479+00	\N	\N
4336fa2d-1b50-44db-b307-e6761c4b48f8	7f2b6227-af62-468c-9302-fcc4aa0a1c0f	1	GPS	38.879601625681715	-84.61662180112297	50	{"latitude": 38.879601625681715, "longitude": -84.61662180112297}		f	f	Step 2	The journey continues...	0.225000000000000006	\N	2025-07-30 03:59:26.825479+00	\N	\N
ff1e1b7c-16f4-48d0-b2f3-e84289f47331	a5769a4b-d859-4151-99d5-0913b338026b	0	GPS	38.87953601775776	-84.61657833825028	50	{"latitude": 38.87953601775776, "longitude": -84.61657833825028}		f	f	Step 1	Your first clue...near by	0.382500000000000007	\N	2025-07-30 04:05:01.312548+00	\N	\N
89638013-1ed6-4c62-a328-c98cc4481858	a5769a4b-d859-4151-99d5-0913b338026b	1	GPS	38.879536065070724	-84.61657825674044	50	{"latitude": 38.879536065070724, "longitude": -84.61657825674044}		f	f	Step 2	The journey continues...	0.382500000000000007	\N	2025-07-30 04:05:01.312548+00	\N	\N
64de7b4b-3df9-4223-bcb8-08337513450f	6327f217-a2d9-497b-ae8d-56cc0a1b912a	0	GPS	38.87964175764412	-84.616538492649	50	{"latitude": 38.87964175764412, "longitude": -84.616538492649}		f	f	Step 1	Your first clue...	0.172499999999999987	\N	2025-07-30 12:15:05.14014+00	\N	\N
8336d5e7-e402-446d-b2f9-6ed8f74e1273	6327f217-a2d9-497b-ae8d-56cc0a1b912a	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name.."}		f	f	Step 2	The journey continues...in the middle...	0.172499999999999987	\N	2025-07-30 12:15:05.14014+00	\N	\N
365f2985-270c-4998-af7e-b10740ca7dd9	6455dece-eaa8-4d5e-b7e8-a099198af5e6	0	GPS	38.879665821655024	-84.61628380149058	50	{"latitude": 38.879665821655024, "longitude": -84.61628380149058}		f	f	Step 1	Your first clue...near by...	0.283499999999999974	\N	2025-07-30 12:36:52.076441+00	\N	\N
83d1cd56-f504-44d0-b22a-dcf0681d4764	6455dece-eaa8-4d5e-b7e8-a099198af5e6	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name.."}		f	f	Step 2	The journey continues...name?	0.283499999999999974	\N	2025-07-30 12:36:52.076441+00	\N	\N
4a2dc729-8388-48cb-8fa4-ddb8201d1dbf	db5e5434-0df6-40b7-a43e-430c7d36dda4	0	GPS	38.87959044019011	-84.61631715458381	50	{"latitude": 38.87959044019011, "longitude": -84.61631715458381}		f	f	Step 1	Your first clue...near by..	0.225000000000000006	\N	2025-07-30 12:45:13.573292+00	\N	\N
b9f970ec-c6e3-4a23-bcfa-5812609f085e	db5e5434-0df6-40b7-a43e-430c7d36dda4	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name.."}		f	f	Step 2	The journey continues...in the middle	0.225000000000000006	\N	2025-07-30 12:45:13.573292+00	\N	\N
6042b59a-0d78-42c5-8fe5-b9a86182dbad	1dd470e4-3f98-4dfb-ba3f-acb28f77e1e9	0	GPS	38.87968654756492	-84.61642137603906	50	{"latitude": 38.87968654756492, "longitude": -84.61642137603906}		f	f	Step 1	Your first clue...near you..	0.280000000000000027	\N	2025-07-30 12:53:24.773997+00	\N	\N
ffa56590-40f4-4094-8ae4-6f15cb1f1a2e	1dd470e4-3f98-4dfb-ba3f-acb28f77e1e9	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name..."}		f	f	Step 2	The journey continues...in the middle	0.280000000000000027	\N	2025-07-30 12:53:24.773997+00	\N	\N
4f4010ae-6fb5-442f-baee-ca7d8fd3d933	248035ec-5ffa-4c11-8e3c-20a4f1b4cfac	0	GPS	38.87950581609278	-84.61658618566042	50	{"latitude": 38.87950581609278, "longitude": -84.61658618566042}		f	f	Step 1	Your first clue...near by	0.225000000000000006	\N	2025-07-30 12:59:16.328266+00	\N	\N
f97c9a84-70d5-495b-ac5c-60a413506e24	248035ec-5ffa-4c11-8e3c-20a4f1b4cfac	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name"}		f	f	Step 2	The journey continues...name	0.225000000000000006	\N	2025-07-30 12:59:16.328266+00	\N	\N
7fc89111-3396-4978-a6a3-cfc9c9bc307a	828a7666-9873-4bc5-93ee-76bdf28ea03e	0	GPS	38.87951343669039	-84.61660551530554	50	{"latitude": 38.87951343669039, "longitude": -84.61660551530554}		f	f	Step 1	Your first clue...near by	0.228000000000000008	\N	2025-07-30 13:08:38.721346+00	\N	\N
2c81c40a-38b2-4443-8a31-b00b9419b92b	828a7666-9873-4bc5-93ee-76bdf28ea03e	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name"}		f	f	Step 2	The journey continues...in the middle	0.228000000000000008	\N	2025-07-30 13:08:38.721346+00	\N	\N
645e1e94-9942-42f4-9a2b-ebdadc12bc17	0e71851c-a44a-45b5-9d88-948297916e98	0	GPS	38.87975870181994	-84.61643678563631	50	{"latitude": 38.87975870181994, "longitude": -84.61643678563631}		f	f	Step 1	Your first clue...near by	0.225000000000000006	\N	2025-07-30 13:19:52.474097+00	\N	\N
3d165673-fb60-41cf-bc79-04bac409df5d	0e71851c-a44a-45b5-9d88-948297916e98	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name?"}		f	f	Step 2	The journey continues...	0.225000000000000006	\N	2025-07-30 13:19:52.474097+00	\N	\N
9c7cd87a-6f72-4231-bed6-c6f206fff278	f4f1cabe-e9b2-4de3-b1aa-0a64d657c1f4	0	GPS	38.87961087766987	-84.61683369666717	50	{"latitude": 38.87961087766987, "longitude": -84.61683369666717}		f	f	Step 1	Your first clue...near you..	0.270000000000000018	\N	2025-07-30 13:35:15.363416+00	\N	\N
847b6de7-2bf5-4fb6-957b-d2dcc612fe4d	f4f1cabe-e9b2-4de3-b1aa-0a64d657c1f4	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name"}		f	f	Step 2	The journey continues...in a middle	0.270000000000000018	\N	2025-07-30 13:35:15.363416+00	\N	\N
343ab587-59c7-4764-89aa-14154bacda4b	c0474f34-4a71-4c12-b0a5-a5bb0c4000e0	0	GPS	38.87957687455293	-84.61645972385708	50	{"latitude": 38.87957687455293, "longitude": -84.61645972385708}		f	f	Step 1	Your first clue...near by	0.270000000000000018	\N	2025-07-30 13:42:38.082091+00	\N	\N
e1fb0c0c-7180-4df1-b4b9-8c4b116ef17f	c0474f34-4a71-4c12-b0a5-a5bb0c4000e0	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name"}		f	f	Step 2	The journey continues...in the middle	0.270000000000000018	\N	2025-07-30 13:42:38.082091+00	\N	\N
ebee2d45-c6c7-4bab-bd33-a52e1b6e262c	4fe0de7a-8121-4398-aaf0-f4988d6ebfd8	0	GPS	38.879694558889156	-84.61665691561542	50	{"latitude": 38.879694558889156, "longitude": -84.61665691561542}		f	f	Step 1	Your first clue...near you	0.337500000000000022	\N	2025-07-30 14:23:26.38593+00	Well played!	message
8297e174-c76c-4779-a22f-95c0fcc9884b	4fe0de7a-8121-4398-aaf0-f4988d6ebfd8	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name..."}		f	f	Step 2	The journey continues...in the middle...	0.337500000000000022	\N	2025-07-30 14:23:26.38593+00	wow.	message
e019a58d-93a6-4e20-ae40-ab14ea6023f3	40be55d6-12ef-4547-82e7-6de38af01aff	0	GPS	38.87965817692515	-84.61670183537454	50	{"latitude": 38.87965817692515, "longitude": -84.61670183537454}		f	f	Step 1	Your first clue...is near by...	0.270000000000000018	\N	2025-07-30 14:36:15.470844+00	Well done!	message
22a8916e-d599-47c3-b1fe-910ade93cf24	40be55d6-12ef-4547-82e7-6de38af01aff	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name..."}		f	f	Step 2	The journey continues...in the middle..	0.270000000000000018	\N	2025-07-30 14:36:15.470844+00	Insane, good work!!!	message
13c3c40c-af2e-418b-b181-8923eb9290cd	00809b19-21eb-4335-941d-c072b21331f0	0	GPS	38.87941727895926	-84.61642750562346	50	{"latitude": 38.87941727895926, "longitude": -84.61642750562346}		f	f	Step 1	Your first clue...near you	0.273000000000000020	\N	2025-07-30 14:46:39.008522+00	well done!	message
7762e277-2682-4a0e-b710-eb4b16d59a0c	00809b19-21eb-4335-941d-c072b21331f0	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name"}		f	f	Guess this word!	The journey continues...in the middle..	0.273000000000000020	\N	2025-07-30 14:46:39.008522+00	wowzers!	message
fa04d48e-6a7d-4b6c-8155-98409f99e96b	27cbbca6-bd9c-45b5-bcbc-a31480ce7a86	0	GPS	38.879605257489715	-84.61652383835602	50	{"latitude": 38.879605257489715, "longitude": -84.61652383835602}		f	f	Step 1	Your first clue...near by	0.228000000000000008	\N	2025-07-30 14:54:52.713694+00	well played!	message
375e51c4-739d-4c97-9e02-3588e3217579	27cbbca6-bd9c-45b5-bcbc-a31480ce7a86	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name"}		f	f	Step 2	The journey continues...in the middle	0.228000000000000008	\N	2025-07-30 14:54:52.713694+00	wow	message
58cf13fa-2c6a-4fa0-8b2f-621f8f3156c6	8c50626b-306a-4a46-a79e-ffea69fca64c	0	GPS	38.87955851488163	-84.61670766384863	50	{"latitude": 38.87955851488163, "longitude": -84.61670766384863}		f	f	Step 1	Your first clue...	0.162000000000000005	\N	2025-07-30 15:01:27.773971+00	Well done!	message
f05a6bc6-a447-470b-b16f-2f43736c1a59	8c50626b-306a-4a46-a79e-ffea69fca64c	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name"}		f	f	Step 2	The journey continues...	0.162000000000000005	\N	2025-07-30 15:01:27.773971+00	Good work.	message
c4727844-61d1-4e71-a929-446d79165ffb	c58b396a-21c4-48b6-9aa1-6dfd6de896fe	0	GPS	38.8793789948951	-84.61654335167287	50	{"latitude": 38.8793789948951, "longitude": -84.61654335167287}		f	f	Step 1	Your first clue...near by..	0.226500000000000007	\N	2025-07-30 15:18:25.703528+00	well played!	message
d061ab4a-ab48-42de-9d4f-a32fece4bda0	c58b396a-21c4-48b6-9aa1-6dfd6de896fe	1	PASSWORD	\N	\N	50	{"password": "Nicholaus", "passwordHint": "name???"}		f	f	Step 2	The journey continues...in the middle	0.226500000000000007	\N	2025-07-30 15:18:25.703528+00	congrats!	message
\.


--
-- Data for Name: gift_chains; Type: TABLE DATA; Schema: public; Owner: geogift
--

COPY public.gift_chains (id, chain_id, creator_id, recipient_address, total_value, total_steps, current_step, status, expires_at, creation_tx_hash, creation_block_number, created_at, updated_at, giver_address, recipient_email, chain_title, chain_description, is_completed, is_expired, expiry_date, blockchain_chain_id, transaction_hash, completed_at) FROM stdin;
50ea9a1c-dc45-42e8-911d-a6ba11811360	1753813023	427e53ee-8002-4beb-ab19-2aa3bce0924e	0x742d35cc6634c0532925a3b8d8c12bfa3b0d9e2d	100	2	0	ACTIVE	2025-08-28 22:17:03.2756+00	0x000000000000000000000000000000000000000000000000000000006889101f	\N	2025-07-29 18:17:03.27177+00	\N	0x19e7e376e7c213b7e7e7e46cc70a5dd086daff2a	test@example.com	Test Multi-Step Adventure	A fun treasure hunt in NYC	f	f	2025-08-28 22:17:03.2756+00	1753813023	0x000000000000000000000000000000000000000000000000000000006889101f	\N
936825b2-6aeb-45f1-bab8-70a79b3343e6	1753813188	427e53ee-8002-4beb-ab19-2aa3bce0924e	0x742d35cc6634c0532925a3b8d8c12bfa3b0d9e2d	100	2	0	ACTIVE	2025-08-28 22:19:48.769667+00	0x00000000000000000000000000000000000000000000000000000000688910c4	\N	2025-07-29 18:19:48.758768+00	\N	0x19e7e376e7c213b7e7e7e46cc70a5dd086daff2a	test@example.com	Test Multi-Step Adventure	A fun treasure hunt in NYC	f	f	2025-08-28 22:19:48.769667+00	1753813188	0x00000000000000000000000000000000000000000000000000000000688910c4	\N
742bf665-1f51-4908-b773-a6679768fcfc	1753813332	427e53ee-8002-4beb-ab19-2aa3bce0924e	0x742d35cc6634c0532925a3b8d8c12bfa3b0d9e2d	100	2	0	ACTIVE	2025-08-28 22:22:13.024868+00	0x0000000000000000000000000000000000000000000000000000000068891154	\N	2025-07-29 18:22:12.942545+00	\N	0x19e7e376e7c213b7e7e7e46cc70a5dd086daff2a	test@example.com	Test Multi-Step Adventure	A fun treasure hunt in NYC	f	f	2025-08-28 22:22:13.024868+00	1753813332	0x0000000000000000000000000000000000000000000000000000000068891154	\N
d3780fde-40c9-4aac-b8fe-58aab79233e4	1753813391	427e53ee-8002-4beb-ab19-2aa3bce0924e	0x742d35cc6634c0532925a3b8d8c12bfa3b0d9e2d	100	2	0	ACTIVE	2025-08-28 22:23:11.825912+00	0x000000000000000000000000000000000000000000000000000000006889118f	\N	2025-07-29 18:23:11.821112+00	\N	0x19e7e376e7c213b7e7e7e46cc70a5dd086daff2a	test@example.com	Test Multi-Step Adventure	A fun treasure hunt in NYC	f	f	2025-08-28 22:23:11.825912+00	1753813391	0x000000000000000000000000000000000000000000000000000000006889118f	\N
6aa88155-5225-40ca-b28a-b68432ea1dd3	1753813420	427e53ee-8002-4beb-ab19-2aa3bce0924e	0x742d35cc6634c0532925a3b8d8c12bfa3b0d9e2d	100	2	0	ACTIVE	2025-08-28 22:23:40.667363+00	0x00000000000000000000000000000000000000000000000000000000688911ac	\N	2025-07-29 18:23:40.660882+00	\N	0x19e7e376e7c213b7e7e7e46cc70a5dd086daff2a	test@example.com	Test Multi-Step Adventure	A fun treasure hunt in NYC	f	f	2025-08-28 22:23:40.667363+00	1753813420	0x00000000000000000000000000000000000000000000000000000000688911ac	\N
c325b457-d2a2-4c22-bb24-c46313e492de	10	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.567	2	0	ACTIVE	2025-08-29 06:01:52.72868+00	0x27854e6b4a650939c6ef94e4860bfc19489df3600da358165f40ab389f034719	\N	2025-07-30 02:01:52.704829+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	Testing this chain creation again	testing	f	f	2025-08-29 06:01:52.72868+00	10	0x27854e6b4a650939c6ef94e4860bfc19489df3600da358165f40ab389f034719	\N
d6f10c3f-9d8f-4d76-b004-fe2b8ecfd0e8	11	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.567	2	0	ACTIVE	2025-08-29 06:04:15.715762+00	0x25d73d119b883fe8cb0e2ad0fcae00bc21b4346156472fd060f21e39d72bd24e	\N	2025-07-30 02:04:15.707174+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	testing	test	f	f	2025-08-29 06:04:15.715762+00	11	0x25d73d119b883fe8cb0e2ad0fcae00bc21b4346156472fd060f21e39d72bd24e	\N
f4a458fe-ce15-4e0b-8c07-65313296a061	13	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.546	2	0	ACTIVE	2025-08-29 07:51:26.429791+00	0x07bcfb72928507ef0d27f41e033946d7b5fea15fce8ceac60d067d1d7a1e4bb4	\N	2025-07-30 03:51:26.406613+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	test gift again	\N	f	f	2025-08-29 07:51:26.429791+00	13	0x07bcfb72928507ef0d27f41e033946d7b5fea15fce8ceac60d067d1d7a1e4bb4	\N
7f2b6227-af62-468c-9302-fcc4aa0a1c0f	14	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.45	2	0	ACTIVE	2025-08-29 07:59:26.861419+00	0xbdd077715e47ccfa47f1d563d8b19830f2a603dadfeeb91cf23143c92125d84d	\N	2025-07-30 03:59:26.825479+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	Custom Chain baby	\N	f	f	2025-08-29 07:59:26.861419+00	14	0xbdd077715e47ccfa47f1d563d8b19830f2a603dadfeeb91cf23143c92125d84d	\N
a5769a4b-d859-4151-99d5-0913b338026b	15	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.765	2	0	ACTIVE	2025-08-29 08:05:01.361368+00	0xc7357c24cda209d7c3dccf0e313e73c88ef571cd7bb61f89d8154a20467f8750	\N	2025-07-30 04:05:01.312548+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	Custom Chain testing again	\N	f	f	2025-08-29 08:05:01.361368+00	15	0xc7357c24cda209d7c3dccf0e313e73c88ef571cd7bb61f89d8154a20467f8750	\N
6327f217-a2d9-497b-ae8d-56cc0a1b912a	16	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.345	2	0	ACTIVE	2025-08-29 16:15:05.165481+00	0x9d50e86b55a6f0d737f83ee86873a6797a6105273289ab3f2fa537cd885a1fa0	\N	2025-07-30 12:15:05.14014+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	Custom Chain testing once more!	\N	f	f	2025-08-29 16:15:05.165481+00	16	0x9d50e86b55a6f0d737f83ee86873a6797a6105273289ab3f2fa537cd885a1fa0	\N
6455dece-eaa8-4d5e-b7e8-a099198af5e6	17	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.567	2	0	ACTIVE	2025-08-29 16:36:52.111415+00	0xbe5ffc77520e4cd308c6400c71a2a9cc38fa23e75451a38e37d2dd33cd04e00a	\N	2025-07-30 12:36:52.076441+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	Hopefully this works...	testing	f	f	2025-08-29 16:36:52.111415+00	17	0xbe5ffc77520e4cd308c6400c71a2a9cc38fa23e75451a38e37d2dd33cd04e00a	\N
db5e5434-0df6-40b7-a43e-430c7d36dda4	18	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.45	2	0	ACTIVE	2025-08-29 16:45:13.588458+00	0x40f330c781b53e90440b9e5fbd6ca4e44ac14f34bd8646bc20e408a3ceb637ee	\N	2025-07-30 12:45:13.573292+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	Custom Chain testing once more...	test	f	f	2025-08-29 16:45:13.588458+00	18	0x40f330c781b53e90440b9e5fbd6ca4e44ac14f34bd8646bc20e408a3ceb637ee	\N
1dd470e4-3f98-4dfb-ba3f-acb28f77e1e9	19	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.56	2	0	ACTIVE	2025-08-29 16:53:24.80195+00	0x3ad91122700a5d7268b275273b575d3dac7ff48c52f2a57bfe41bbdb78a3ea6d	\N	2025-07-30 12:53:24.773997+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	Custom Chain testing once more!!	testing testing	f	f	2025-08-29 16:53:24.80195+00	19	0x3ad91122700a5d7268b275273b575d3dac7ff48c52f2a57bfe41bbdb78a3ea6d	\N
248035ec-5ffa-4c11-8e3c-20a4f1b4cfac	20	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.45	2	0	ACTIVE	2025-08-29 16:59:16.344876+00	0xe20e3f48f7d67870c5021739a3290e150a6b51998c58e5682feec133d9051e8a	\N	2025-07-30 12:59:16.328266+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	Custom Chain baby	test	f	f	2025-08-29 16:59:16.344876+00	20	0xe20e3f48f7d67870c5021739a3290e150a6b51998c58e5682feec133d9051e8a	\N
828a7666-9873-4bc5-93ee-76bdf28ea03e	21	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.456	2	0	ACTIVE	2025-08-29 17:08:38.735788+00	0x0cbf764ec8e11b450fe575df614b6a49f7fd8aea6242944f979324d1acc5947d	\N	2025-07-30 13:08:38.721346+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	Custom Chain testing still	tsting	f	f	2025-08-29 17:08:38.735788+00	21	0x0cbf764ec8e11b450fe575df614b6a49f7fd8aea6242944f979324d1acc5947d	\N
0e71851c-a44a-45b5-9d88-948297916e98	22	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.45	2	0	ACTIVE	2025-08-29 17:19:52.492683+00	0x35c08751c3d93bae4dea9189aae2d85633a087b6b497c47fc7f54e3ea22a6f12	\N	2025-07-30 13:19:52.474097+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	Custom Chain baby	testing once more	f	f	2025-08-29 17:19:52.492683+00	22	0x35c08751c3d93bae4dea9189aae2d85633a087b6b497c47fc7f54e3ea22a6f12	\N
f4f1cabe-e9b2-4de3-b1aa-0a64d657c1f4	23	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.54	2	0	ACTIVE	2025-08-29 17:35:15.394747+00	0x6b6272057a1bd2bf9a06486af69fa94705ee38387fa405fe38a8066255c2f5e1	\N	2025-07-30 13:35:15.363416+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	Custom Chain baby	test	f	f	2025-08-29 17:35:15.394747+00	23	0x6b6272057a1bd2bf9a06486af69fa94705ee38387fa405fe38a8066255c2f5e1	\N
c0474f34-4a71-4c12-b0a5-a5bb0c4000e0	24	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.54	2	0	ACTIVE	2025-08-29 17:42:38.093685+00	0x94fe9a88973d8d02df9a79b6a5589d19ad7da4222e52c9ebf8b1313d461f252a	\N	2025-07-30 13:42:38.082091+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	i dont know anymore	test	f	f	2025-08-29 17:42:38.093685+00	24	0x94fe9a88973d8d02df9a79b6a5589d19ad7da4222e52c9ebf8b1313d461f252a	\N
4fe0de7a-8121-4398-aaf0-f4988d6ebfd8	25	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.675	2	0	ACTIVE	2025-08-29 18:23:26.423212+00	0x2f3cbaa496b31381acdc4aa7a0efeda587be4cb20d17b87aa2143c0e5ea5aa77	\N	2025-07-30 14:23:26.38593+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	Custom Chain baby!	test	f	f	2025-08-29 18:23:26.423212+00	25	0x2f3cbaa496b31381acdc4aa7a0efeda587be4cb20d17b87aa2143c0e5ea5aa77	\N
40be55d6-12ef-4547-82e7-6de38af01aff	26	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.54	2	0	ACTIVE	2025-08-29 18:36:15.497254+00	0x64abb7b3a4bb0631356571397310e6599abbcddd7e0a0c8b27da2e9ebebcc912	\N	2025-07-30 14:36:15.470844+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	We are cookin!!	testing for my application.	f	f	2025-08-29 18:36:15.497254+00	26	0x64abb7b3a4bb0631356571397310e6599abbcddd7e0a0c8b27da2e9ebebcc912	\N
00809b19-21eb-4335-941d-c072b21331f0	27	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.546	2	0	ACTIVE	2025-08-29 18:46:39.060842+00	0x1b4b2c82d3b9caa4939eb5f1c68d98f9fa5a2044dbc6e19cb755f1e42fd50515	\N	2025-07-30 14:46:39.008522+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	We might have something.	test	f	f	2025-08-29 18:46:39.060842+00	27	0x1b4b2c82d3b9caa4939eb5f1c68d98f9fa5a2044dbc6e19cb755f1e42fd50515	\N
27cbbca6-bd9c-45b5-bcbc-a31480ce7a86	28	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.456	2	0	ACTIVE	2025-08-29 18:54:52.740339+00	0xb92a6c7d7a11774d42be446b4cdad22bd8e7e236d0605f58565bed673f35143a	\N	2025-07-30 14:54:52.713694+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	Please fucking work	test	f	f	2025-08-29 18:54:52.740339+00	28	0xb92a6c7d7a11774d42be446b4cdad22bd8e7e236d0605f58565bed673f35143a	\N
8c50626b-306a-4a46-a79e-ffea69fca64c	29	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.324	2	0	ACTIVE	2025-08-29 19:01:27.797781+00	0x9952ebea8214212a2a46ac4661b2a2867cfca412846e77e6a9dc8066903e328e	\N	2025-07-30 15:01:27.773971+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	testing more	\N	f	f	2025-08-29 19:01:27.797781+00	29	0x9952ebea8214212a2a46ac4661b2a2867cfca412846e77e6a9dc8066903e328e	\N
c58b396a-21c4-48b6-9aa1-6dfd6de896fe	30	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16af3ab0cbd8ea95d04ea3999d8905cd139ec92f	.453	2	0	ACTIVE	2025-08-29 19:18:25.719489+00	0x089578a882dde0f5ccc9f65565304cb28d910e05c6f940aee03821220f91f8d0	\N	2025-07-30 15:18:25.703528+00	\N	0x2fa710b2a99cdd9e314080b78b0f7bf78c126234	setheggerrocks@gmail.com	Please fucking work!	\N	f	f	2025-08-29 19:18:25.719489+00	30	0x089578a882dde0f5ccc9f65565304cb28d910e05c6f940aee03821220f91f8d0	\N
\.


--
-- Data for Name: gifts; Type: TABLE DATA; Schema: public; Owner: geogift
--

COPY public.gifts (id, sender_id, recipient_address, escrow_id, lat, lon, message, status, created_at, updated_at, unlock_type, unlock_challenge_data, reward_content, reward_content_type) FROM stdin;
6edd2fb0-5e9c-402d-a27e-e14c642ed9b1	427e53ee-8002-4beb-ab19-2aa3bce0924e	0x742d35Cc6634C0532925a3b8D8C12bFA3B0D9e2d	12345	40.7831	-73.9712	Happy Birthday! Find this gift in Central Park!	PENDING	2025-07-29 17:50:48.248018+00	\N	GPS	\N	\N	\N
5af505cc-c75c-4a54-9972-4252a5cd2827	427e53ee-8002-4beb-ab19-2aa3bce0924e	0x742d35Cc6634C0532925a3b8D8C12bFA3B0D9e2d	gift_1753811630	40.7831	-73.9712	Happy Birthday! Find this gift in Central Park!	PENDING	2025-07-29 17:53:50.51516+00	\N	GPS	\N	\N	\N
02f83cb4-8bef-4e9b-9ddb-93fdc2bff9d8	427e53ee-8002-4beb-ab19-2aa3bce0924e	0x742d35Cc6634C0532925a3b8D8C12bFA3B0D9e2d	gift_1753813475	40.7831	-73.9712	Happy Birthday! Find this gift in Central Park!	PENDING	2025-07-29 18:24:35.274547+00	\N	GPS	\N	\N	\N
3e1db526-dd8c-45d8-9061-6b8c16993f93	427e53ee-8002-4beb-ab19-2aa3bce0924e	0x742d35Cc6634C0532925a3b8D8C12bFA3B0D9e2d	gift_1753814228	40.7831	-73.9712	Happy Birthday! Find this gift in Central Park!	PENDING	2025-07-29 18:37:08.90541+00	\N	GPS	\N	\N	\N
64e7ba79-d7bc-425e-8ffa-fdc823ea5450	f59fa37c-0e5d-4e23-8100-30d88fb9b884	0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F	15	40.7831	-73.9712	This is the test message for gift 15 - If you can see this, the message fix is working\\!	PENDING	2025-07-29 23:09:21.973774+00	\N	GPS	\N	\N	\N
9558550b-87f0-4f51-9699-2f1fadf4d144	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F	16	38.879851603233384	-84.61664154582412	Hello there, I hope you can figure this out...it is in the middle...	PENDING	2025-07-30 00:04:25.092163+00	\N	URL	poop.com	\N	\N
cdfcc220-3e25-43ce-9112-c4dc51e61046	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F	17	0	0	Somewhere in the middle....	PENDING	2025-07-30 00:32:53.393745+00	\N	PASSWORD	Nicholaus	Well done!!	message
aab8e2d9-26f6-40c2-b63a-7b5f9364ebc5	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F	18	0	0	Hope this finds you well. Hint: Somewhere in the middle...name...?	PENDING	2025-07-30 00:45:03.399161+00	\N	PASSWORD	Nicholaus	I love you!	message
a25e23df-00d2-451b-ab8b-e92a568f93e7	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F	19	38.87958640132048	-84.61665974034128	Hello, you should be near it...	PENDING	2025-07-30 00:48:40.390988+00	\N	GPS	\N	\N	\N
beab855e-c2b1-4214-b907-2ff1eafcd4ac	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F	20	38.87959679971344	-84.61640855398339	Hello, you might be closer than you realize!!!	PENDING	2025-07-30 00:53:40.395342+00	\N	GPS	\N	I love you!	message
2e0b1948-d784-43a6-b153-eb4b4de324ff	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F	21	38.88033600667393	-84.61765630477362	Hola!	PENDING	2025-07-30 15:28:41.350818+00	\N	GPS	\N	Well played!!	message
1678c1a2-5dac-4cb1-9f1c-041b9e741a74	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F	22	0	0	For my friend, I hope you have the most wonderful day!	PENDING	2025-07-30 23:05:54.193227+00	\N	PASSWORD	Nicholaus	I love you!	message
62a18cfa-ec61-41a1-a009-9c2cab86c120	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F	23	0	0	Hello AGAIN!! Guess the password and earn some bread...	PENDING	2025-07-30 23:20:33.746768+00	\N	PASSWORD	Nicholaus	Nice!!!	message
8f663a47-99d2-4ec3-bef9-806f67c067d5	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F	24	0	0	Hola! whats the middle?	PENDING	2025-07-31 00:17:29.017547+00	\N	PASSWORD	Nicholaus	Well played!!	message
9610ac91-b259-4a80-b82c-e888101a0538	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F	25	0	0	hi	PENDING	2025-07-31 00:33:28.329079+00	\N	PASSWORD	Bibi	\N	\N
682474f3-4d28-47e9-a0ed-0eeda1be68fc	f59fa37c-0e5d-4e23-8100-30d88fb9b884	0x2Fa710B2A99Cdd9e314080B78B0F7bF78c126234	26	0	0	Hi	PENDING	2025-07-31 01:31:38.49881+00	\N	PASSWORD	Pippy	\N	\N
2b08437c-e8c3-4d54-9775-5fd3ea5eeda2	916fdf36-f3b3-408e-8b70-403c16bb5a63	0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F	27	0	0	Hello! middle...	PENDING	2025-07-31 23:33:30.90034+00	\N	PASSWORD	Nicholaus86	Well done! Enjoy the 7 GGT's	message
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: geogift
--

COPY public.users (id, wallet_address, created_at, updated_at, display_name, bio, favorite_location, is_public_profile, email_notifications, gift_notifications, marketing_emails, total_gifts_created, total_gifts_claimed, total_chains_created, first_gift_created_at, first_gift_claimed_at, last_activity_at) FROM stdin;
427e53ee-8002-4beb-ab19-2aa3bce0924e	0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A	2025-07-29 17:50:48.150783+00	\N	\N	\N	\N	f	t	t	f	0	0	0	\N	\N	\N
f59fa37c-0e5d-4e23-8100-30d88fb9b884	0x16AF3ab0cBd8EA95d04ea3999D8905CD139ec92F	2025-07-29 19:09:14.366695+00	\N	\N	\N	\N	f	t	t	f	0	0	0	\N	\N	\N
916fdf36-f3b3-408e-8b70-403c16bb5a63	0x2Fa710B2A99Cdd9e314080B78B0F7bF78c126234	2025-07-29 18:27:00.601277+00	2025-07-30 23:13:48.221881+00	Seth Egger	\N	\N	f	t	t	f	0	0	0	\N	\N	\N
ecad0d32-7493-42b8-900f-733f42b163b9	0x34658EE37146f125C39D12b6f586efD363AA1002	2025-07-31 01:44:58.463782+00	\N	\N	\N	\N	f	t	t	f	0	0	0	\N	\N	\N
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: geogift
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: chain_claims pk_chain_claims; Type: CONSTRAINT; Schema: public; Owner: geogift
--

ALTER TABLE ONLY public.chain_claims
    ADD CONSTRAINT pk_chain_claims PRIMARY KEY (id);


--
-- Name: chain_steps pk_chain_steps; Type: CONSTRAINT; Schema: public; Owner: geogift
--

ALTER TABLE ONLY public.chain_steps
    ADD CONSTRAINT pk_chain_steps PRIMARY KEY (id);


--
-- Name: gift_chains pk_gift_chains; Type: CONSTRAINT; Schema: public; Owner: geogift
--

ALTER TABLE ONLY public.gift_chains
    ADD CONSTRAINT pk_gift_chains PRIMARY KEY (id);


--
-- Name: gifts pk_gifts; Type: CONSTRAINT; Schema: public; Owner: geogift
--

ALTER TABLE ONLY public.gifts
    ADD CONSTRAINT pk_gifts PRIMARY KEY (id);


--
-- Name: users pk_users; Type: CONSTRAINT; Schema: public; Owner: geogift
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT pk_users PRIMARY KEY (id);


--
-- Name: ix_gift_chains_chain_id; Type: INDEX; Schema: public; Owner: geogift
--

CREATE UNIQUE INDEX ix_gift_chains_chain_id ON public.gift_chains USING btree (chain_id);


--
-- Name: ix_gifts_escrow_id; Type: INDEX; Schema: public; Owner: geogift
--

CREATE UNIQUE INDEX ix_gifts_escrow_id ON public.gifts USING btree (escrow_id);


--
-- Name: ix_users_wallet_address; Type: INDEX; Schema: public; Owner: geogift
--

CREATE UNIQUE INDEX ix_users_wallet_address ON public.users USING btree (wallet_address);


--
-- Name: chain_claims fk_chain_claims_chain_id_gift_chains; Type: FK CONSTRAINT; Schema: public; Owner: geogift
--

ALTER TABLE ONLY public.chain_claims
    ADD CONSTRAINT fk_chain_claims_chain_id_gift_chains FOREIGN KEY (chain_id) REFERENCES public.gift_chains(id);


--
-- Name: chain_claims fk_chain_claims_step_id_chain_steps; Type: FK CONSTRAINT; Schema: public; Owner: geogift
--

ALTER TABLE ONLY public.chain_claims
    ADD CONSTRAINT fk_chain_claims_step_id_chain_steps FOREIGN KEY (step_id) REFERENCES public.chain_steps(id);


--
-- Name: chain_steps fk_chain_steps_chain_id_gift_chains; Type: FK CONSTRAINT; Schema: public; Owner: geogift
--

ALTER TABLE ONLY public.chain_steps
    ADD CONSTRAINT fk_chain_steps_chain_id_gift_chains FOREIGN KEY (chain_id) REFERENCES public.gift_chains(id);


--
-- Name: gift_chains fk_gift_chains_creator_id_users; Type: FK CONSTRAINT; Schema: public; Owner: geogift
--

ALTER TABLE ONLY public.gift_chains
    ADD CONSTRAINT fk_gift_chains_creator_id_users FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: gifts fk_gifts_sender_id_users; Type: FK CONSTRAINT; Schema: public; Owner: geogift
--

ALTER TABLE ONLY public.gifts
    ADD CONSTRAINT fk_gifts_sender_id_users FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

