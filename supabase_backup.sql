


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."analytics_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resource_id" "uuid",
    "time_window" "text" NOT NULL,
    "metric" "text" NOT NULL,
    "count" bigint NOT NULL,
    "captured_at" "date" DEFAULT CURRENT_DATE NOT NULL
);


ALTER TABLE "public"."analytics_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "resource_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bookmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collection_items" (
    "collection_id" "uuid" NOT NULL,
    "resource_id" "uuid" NOT NULL,
    "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."collection_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."collections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "emoji" "text",
    "gradient_from" "text",
    "gradient_to" "text",
    "is_featured" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_private" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."collections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ingestion_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_name" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    "status" "text" NOT NULL,
    "processed_count" integer DEFAULT 0 NOT NULL,
    "skipped_count" integer DEFAULT 0 NOT NULL,
    "failed_count" integer DEFAULT 0 NOT NULL,
    "error_summary" "text",
    "metadata" "jsonb",
    CONSTRAINT "ingestion_runs_status_check" CHECK (("status" = ANY (ARRAY['running'::"text", 'succeeded'::"text", 'partial'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."ingestion_runs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."latest_analytics_snapshots" WITH ("security_invoker"='true') AS
 SELECT DISTINCT ON ("resource_id", "time_window", "metric") "id",
    "resource_id",
    "time_window",
    "metric",
    "count",
    "captured_at"
   FROM "public"."analytics_snapshots"
  ORDER BY "resource_id", "time_window", "metric", "captured_at" DESC;


ALTER VIEW "public"."latest_analytics_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resource_categories" (
    "resource_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "is_primary" boolean DEFAULT false
);


ALTER TABLE "public"."resource_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resource_icons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "resource_id" "uuid",
    "url" "text" NOT NULL,
    "width" integer,
    "height" integer,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resource_icons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_id" "uuid",
    "kind" "text" NOT NULL,
    "token" "text" NOT NULL,
    "display_name" "text",
    "description" "text",
    "homepage" "text",
    "license" "text",
    "latest_version" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "api_base_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_resource_annotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "resource_id" "uuid" NOT NULL,
    "note" "text",
    "install_state" "text" DEFAULT 'planned'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_resource_annotations_install_state_check" CHECK (("install_state" = ANY (ARRAY['planned'::"text", 'installed'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."user_resource_annotations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_resource_tags" (
    "annotation_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."user_resource_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#6366f1'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_tags" OWNER TO "postgres";


ALTER TABLE ONLY "public"."analytics_snapshots"
    ADD CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_snapshots"
    ADD CONSTRAINT "analytics_snapshots_resource_id_time_window_metric_captured_key" UNIQUE ("resource_id", "time_window", "metric", "captured_at");



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_user_id_resource_id_key" UNIQUE ("user_id", "resource_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."collection_items"
    ADD CONSTRAINT "collection_items_pkey" PRIMARY KEY ("collection_id", "resource_id");



ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."ingestion_runs"
    ADD CONSTRAINT "ingestion_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resource_categories"
    ADD CONSTRAINT "resource_categories_pkey" PRIMARY KEY ("resource_id", "category_id");



ALTER TABLE ONLY "public"."resource_icons"
    ADD CONSTRAINT "resource_icons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resource_icons"
    ADD CONSTRAINT "resource_icons_resource_id_key" UNIQUE ("resource_id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_source_id_token_key" UNIQUE ("source_id", "token");



ALTER TABLE ONLY "public"."sources"
    ADD CONSTRAINT "sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sources"
    ADD CONSTRAINT "sources_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_resource_annotations"
    ADD CONSTRAINT "user_resource_annotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_resource_annotations"
    ADD CONSTRAINT "user_resource_annotations_user_id_resource_id_key" UNIQUE ("user_id", "resource_id");



ALTER TABLE ONLY "public"."user_resource_tags"
    ADD CONSTRAINT "user_resource_tags_pkey" PRIMARY KEY ("annotation_id", "tag_id");



ALTER TABLE ONLY "public"."user_tags"
    ADD CONSTRAINT "user_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tags"
    ADD CONSTRAINT "user_tags_user_id_name_key" UNIQUE ("user_id", "name");



CREATE INDEX "idx_analytics_snapshots_resource_date" ON "public"."analytics_snapshots" USING "btree" ("resource_id", "captured_at");



CREATE INDEX "idx_analytics_snapshots_window_metric" ON "public"."analytics_snapshots" USING "btree" ("time_window", "metric");



CREATE INDEX "idx_annotations_user_resource" ON "public"."user_resource_annotations" USING "btree" ("user_id", "resource_id");



CREATE INDEX "idx_bookmarks_user_id" ON "public"."bookmarks" USING "btree" ("user_id");



CREATE INDEX "idx_collection_items_collection" ON "public"."collection_items" USING "btree" ("collection_id");



CREATE INDEX "idx_ingestion_runs_job_name_started_at" ON "public"."ingestion_runs" USING "btree" ("job_name", "started_at" DESC);



CREATE INDEX "idx_resources_token" ON "public"."resources" USING "btree" ("token");



ALTER TABLE ONLY "public"."analytics_snapshots"
    ADD CONSTRAINT "analytics_snapshots_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookmarks"
    ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collection_items"
    ADD CONSTRAINT "collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collection_items"
    ADD CONSTRAINT "collection_items_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resource_categories"
    ADD CONSTRAINT "resource_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resource_categories"
    ADD CONSTRAINT "resource_categories_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resource_icons"
    ADD CONSTRAINT "resource_icons_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_resource_annotations"
    ADD CONSTRAINT "user_resource_annotations_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_resource_annotations"
    ADD CONSTRAINT "user_resource_annotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_resource_tags"
    ADD CONSTRAINT "user_resource_tags_annotation_id_fkey" FOREIGN KEY ("annotation_id") REFERENCES "public"."user_resource_annotations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_resource_tags"
    ADD CONSTRAINT "user_resource_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."user_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tags"
    ADD CONSTRAINT "user_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Public read access for analytics_snapshots" ON "public"."analytics_snapshots" FOR SELECT USING (true);



CREATE POLICY "Public read access for categories" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Public read access for ingestion_runs" ON "public"."ingestion_runs" FOR SELECT USING (true);



CREATE POLICY "Public read access for resource_categories" ON "public"."resource_categories" FOR SELECT USING (true);



CREATE POLICY "Public read access for resource_icons" ON "public"."resource_icons" FOR SELECT USING (true);



CREATE POLICY "Public read access for resources" ON "public"."resources" FOR SELECT USING (true);



CREATE POLICY "Public read access for sources" ON "public"."sources" FOR SELECT USING (true);



CREATE POLICY "Read collection items" ON "public"."collection_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."collections"
  WHERE (("collections"."id" = "collection_items"."collection_id") AND (("collections"."is_private" = false) OR ("collections"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Read collections" ON "public"."collections" FOR SELECT USING ((("is_private" = false) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Users can delete from own collections" ON "public"."collection_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."collections"
  WHERE (("collections"."id" = "collection_items"."collection_id") AND ("collections"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own bookmarks" ON "public"."bookmarks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own collections" ON "public"."collections" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert into own collections" ON "public"."collection_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."collections"
  WHERE (("collections"."id" = "collection_items"."collection_id") AND ("collections"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own bookmarks" ON "public"."bookmarks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own collections" ON "public"."collections" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own bookmarks" ON "public"."bookmarks" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own collection items" ON "public"."collection_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."collections"
  WHERE (("collections"."id" = "collection_items"."collection_id") AND ("collections"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own collections" ON "public"."collections" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users delete own annotations" ON "public"."user_resource_annotations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users delete own resource tags" ON "public"."user_resource_tags" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."user_resource_annotations"
  WHERE (("user_resource_annotations"."id" = "user_resource_tags"."annotation_id") AND ("user_resource_annotations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users delete own tags" ON "public"."user_tags" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users insert own annotations" ON "public"."user_resource_annotations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users insert own resource tags" ON "public"."user_resource_tags" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_resource_annotations"
  WHERE (("user_resource_annotations"."id" = "user_resource_tags"."annotation_id") AND ("user_resource_annotations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users insert own tags" ON "public"."user_tags" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users read own annotations" ON "public"."user_resource_annotations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users read own resource tags" ON "public"."user_resource_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_resource_annotations"
  WHERE (("user_resource_annotations"."id" = "user_resource_tags"."annotation_id") AND ("user_resource_annotations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users read own tags" ON "public"."user_tags" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users update own annotations" ON "public"."user_resource_annotations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users update own tags" ON "public"."user_tags" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."analytics_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collection_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."collections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ingestion_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resource_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resource_icons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_resource_annotations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_resource_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_tags" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





































































































































































GRANT ALL ON TABLE "public"."analytics_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."analytics_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."collection_items" TO "anon";
GRANT ALL ON TABLE "public"."collection_items" TO "authenticated";
GRANT ALL ON TABLE "public"."collection_items" TO "service_role";



GRANT ALL ON TABLE "public"."collections" TO "anon";
GRANT ALL ON TABLE "public"."collections" TO "authenticated";
GRANT ALL ON TABLE "public"."collections" TO "service_role";



GRANT ALL ON TABLE "public"."ingestion_runs" TO "anon";
GRANT ALL ON TABLE "public"."ingestion_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."ingestion_runs" TO "service_role";



GRANT ALL ON TABLE "public"."latest_analytics_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."latest_analytics_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."latest_analytics_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."resource_categories" TO "anon";
GRANT ALL ON TABLE "public"."resource_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."resource_categories" TO "service_role";



GRANT ALL ON TABLE "public"."resource_icons" TO "anon";
GRANT ALL ON TABLE "public"."resource_icons" TO "authenticated";
GRANT ALL ON TABLE "public"."resource_icons" TO "service_role";



GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";



GRANT ALL ON TABLE "public"."sources" TO "anon";
GRANT ALL ON TABLE "public"."sources" TO "authenticated";
GRANT ALL ON TABLE "public"."sources" TO "service_role";



GRANT ALL ON TABLE "public"."user_resource_annotations" TO "anon";
GRANT ALL ON TABLE "public"."user_resource_annotations" TO "authenticated";
GRANT ALL ON TABLE "public"."user_resource_annotations" TO "service_role";



GRANT ALL ON TABLE "public"."user_resource_tags" TO "anon";
GRANT ALL ON TABLE "public"."user_resource_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."user_resource_tags" TO "service_role";



GRANT ALL ON TABLE "public"."user_tags" TO "anon";
GRANT ALL ON TABLE "public"."user_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."user_tags" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































