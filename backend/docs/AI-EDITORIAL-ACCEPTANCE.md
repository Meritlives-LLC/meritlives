# AI Editorial Assistant isolated acceptance — 2026-10-31

Final Laravel result: PASS — 74 tests, 596 assertions, zero failures. Frontend forms: 34/34 PASS. TypeScript: PASS. Final mock-provider browser acceptance: PASS (see the browser acceptance section below).

Isolation: process variables EDITORIAL_MEMORY_ONLY=1, APP_ENV=testing, DB_CONNECTION=sqlite, DB_DATABASE=:memory:, DB_URL empty, AI_EDITORIAL_ENABLED=true, AI_EDITORIAL_PROVIDER=mock. PHPUnit uses backend/phpunit.xml. The opt-in TestCase guard runs after configuration loading and before provider registration; it fails closed on unsafe configuration, removes all connections except SQLite, rejects non-SQLite connectors and persistent SQLite paths, and prevents stray Laravel HTTP requests. EditorialIsolationTest verified SQLite PDO, an empty PRAGMA database_list file path, unavailable mysql/wordpress/mariadb/pgsql/sqlsrv connections, and rejection of a persistent SQLite path. No existing database was used.

Persistence: actual SQL-backed saves into disposable in-memory SQLite via RefreshDatabase migrations, role seeding and factory users. No browser or simulated save is represented as a browser end-to-end save. News remained pending with null publication date and featured=false even after status tampering before save. Blog outline saved draft, and introduction replacement revoked existing approval, cleared publication fields and preserved the remainder. Public API tests excluded drafts, unapproved posts and future posts, and checked immediate approval revocation.

Security and errors: guest editor redirects and guest service rejection; author ownership and resource permissions; disabled feature; oversized and missing-source input; generation rate limit; mocked quota, malformed/refused/incomplete output, provider failures and timeouts. Additional Livewire checks verified editable suggestions, replacement confirmation, unselected field preservation, SEO/category application and unsaved News preservation after validation/provider errors. Mock category recommendations are null by design; selecting an existing active category was exercised, not real model category judgment.

Failures investigated: initial related run had 56 tests / 383 assertions / 1 failure: an exact Cache-Control directive-order assertion. Symfony canonicalizes the header to max-age=0, no-store, private. Replaced the assertion with semantic directive checks; cache behavior unchanged. The next focused run had 7 tests / 95 assertions / 2 failures: the public Blog fixture omitted is_public_approved=true, and the new validation test expected a modal-prefixed error although the service produces an unscoped source_text error. Corrected test fixture/assertion only. Browser field-level display of that validation error remains unverified. Final combined run passed.

Historical browser gap before the final browser pass: no existing in-memory application browser harness or persistent worker is configured. Standard request lifetimes do not retain a SQLite :memory: database or array sessions across browser requests. No MySQL-backed server or existing-database credentials were used. AI modal opening/closing, keyboard focus, loading/error presentation, and responsiveness at 390/768/1440px remain NOT VERIFIED. Full browser end-to-end acceptance is incomplete.

Commands: php -d extension=pdo_sqlite -d extension=sqlite3 vendor/bin/phpunit --testdox --do-not-cache-result tests/Feature/AiEditorialAssistantTest.php; related-suite filter run; focused EditorialAcceptanceTest|EditorialApiIntegrationTest run; final filter covering all suites below with --log-junit tests/editorial-acceptance-results.xml. Every PHP run used the isolation variables above. Frontend: npm.cmd run test:forms; npx.cmd tsc --noEmit --incremental false. git diff --check passed. Frontend build passed in the preceding acceptance turn and was not repeated in this continuation.

Changed in this continuation: tests/TestCase.php (opt-in safety guard), tests/Feature/EditorialAcceptanceTest.php (new), tests/Feature/EditorialIsolationTest.php (new), tests/Feature/EditorialApiIntegrationTest.php (semantic cache assertion and approved fixture). Artifacts: this report and tests/editorial-acceptance-results.xml. Existing unrelated modified/untracked files preserved. No application/environment changes, real AI calls, deployment, push or real article publication.

Before live AI: the mock browser checks below are complete; verify configured model, backend credentials and budgets in a separately authorized live-provider test. Live provider behavior and factual quality are not established by mock tests.

## Exact final Laravel inventory

### Tests\Feature\AiEditorialAssistantTest — 14 tests, 96 assertions

- PASS `test_mock_preserves_attribution_and_never_creates_content` — 6 assertions
- PASS `test_news_url_without_facts_is_rejected` — 1 assertions
- PASS `test_oversized_input_is_rejected` — 1 assertions
- PASS `test_generation_is_rate_limited` — 1 assertions
- PASS `test_wrong_category_type_and_inactive_categories_are_rejected` — 1 assertions
- PASS `test_author_cannot_edit_another_authors_blog_or_generate_news` — 2 assertions
- PASS `test_responses_request_is_structured_and_uses_backend_key` — 2 assertions
- PASS `test_insufficient_credits_returns_safe_message` — 1 assertions
- PASS `test_unassigned_user_and_disabled_feature_are_denied` — 2 assertions
- PASS `test_malformed_refused_and_incomplete_provider_output_fails_safely` — 6 assertions
- PASS `test_inactive_category_is_rejected_and_html_is_removed` — 2 assertions
- PASS `test_blog_outline_requires_explicit_apply_and_saves_draft` — 21 assertions
- PASS `test_filament_generate_review_apply_and_save_stays_pending` — 21 assertions
- PASS `test_introduction_requires_confirmation_preserves_remainder_and_revokes_approval` — 29 assertions

### Tests\Feature\AiStudioWorkflowTest — 14 tests, 64 assertions

- PASS `test_default_disabled_configuration_prevents_provider_calls` — 3 assertions
- PASS `test_enabled_flag_without_provider_still_makes_no_provider_call` — 1 assertions
- PASS `test_unassigned_user_cannot_create_or_generate_ai_jobs` — 2 assertions
- PASS `test_prompt_validation_and_version_snapshot_are_enforced` — 4 assertions
- PASS `test_article_preview_requires_review_and_only_explicitly_creates_unpublished_blog_draft` — 11 assertions
- PASS `test_rejection_is_recorded_and_cannot_create_blog_content` — 2 assertions
- PASS `test_failed_provider_is_safely_reported_and_not_exposed` — 3 assertions
- PASS `test_openai_secrets_prompts_and_provider_body_do_not_leak_from_failed_workflow` — 17 assertions
- PASS `test_approved_image_is_validated_stored_privately_then_attached_only_on_explicit_action` — 5 assertions
- PASS `test_private_image_preview_requires_ai_view_permission` — 4 assertions
- PASS `test_invalid_image_data_fails_and_traversal_preview_path_is_rejected` — 2 assertions
- PASS `test_image_size_limit_is_enforced` — 3 assertions
- PASS `test_rejection_requires_a_reason` — 1 assertions
- PASS `test_audit_events_are_append_only_and_ai_has_no_public_api` — 6 assertions

### Tests\Feature\EditorialAcceptanceTest — 4 tests, 91 assertions

- PASS `test_guest_cannot_open_editors_or_generate` — 6 assertions
- PASS `test_news_preview_is_editable_confirmation_required_and_unselected_copy_survives` — 29 assertions
- PASS `test_blog_seo_and_existing_category_apply_without_overwriting_unsaved_body` — 34 assertions
- PASS `test_provider_failure_and_validation_preserve_unsaved_news_form` — 22 assertions

### Tests\Feature\EditorialApiIntegrationTest — 3 tests, 41 assertions

- PASS `test_news_blog_and_search_endpoints_return_published_editorial_content` — 33 assertions
- PASS `test_revoking_public_approval_removes_blog_from_public_listing_and_detail_immediately` — 6 assertions
- PASS `test_blog_public_endpoints_return_no_posts_when_no_eligible_posts_exist` — 2 assertions

### Tests\Feature\EditorialIsolationTest — 1 tests, 14 assertions

- PASS `test_acceptance_process_is_memory_only_and_mysql_is_unavailable` — 14 assertions

### Tests\Feature\FilamentResourceAuthorizationTest — 3 tests, 17 assertions

- PASS `test_editor_permissions_are_enforced_at_resource_level` — 10 assertions
- PASS `test_unassigned_user_cannot_use_filament_resources` — 5 assertions
- PASS `test_admin_can_manage_news_sources` — 2 assertions

### Tests\Feature\NewsDiscoveryWorkflowTest — 13 tests, 64 assertions

- PASS `test_category_matching_deduplicates_repeated_refreshes_and_keeps_discovery_out_of_news` — 9 assertions
- PASS `test_canonical_duplicate_from_another_source_is_flagged_and_not_rewritten` — 3 assertions
- PASS `test_unapproved_host_is_rejected_before_any_request` — 2 assertions
- PASS `test_redirect_is_rejected_and_never_followed` — 1 assertions
- PASS `test_external_entity_xml_is_rejected` — 1 assertions
- PASS `test_oversized_feed_is_rejected_after_the_configured_limit` — 2 assertions
- PASS `test_rewrite_disabled_and_invalid_provider_results_fail_without_fake_success` — 6 assertions
- PASS `test_openai_rewrite_with_invalid_required_schema_fails_news_validation` — 4 assertions
- PASS `test_provider_failure_is_safely_reported_and_audited` — 4 assertions
- PASS `test_human_review_then_explicit_unpublished_news_draft_and_publication_are_separate` — 19 assertions
- PASS `test_unapproved_editorial_actions_are_rejected_server_side` — 1 assertions
- PASS `test_blog_draft_and_image_approval_are_separate_and_attachment_is_explicit` — 9 assertions
- PASS `test_existing_published_news_is_marked_duplicate_without_being_overwritten` — 3 assertions

### Tests\Feature\OpenAiGenerationProviderTest — 10 tests, 33 assertions

- PASS `test_article_request_uses_server_key_and_returns_validated_contract` — 5 assertions
- PASS `test_configured_connection_and_request_timeouts_are_applied` — 7 assertions
- PASS `test_missing_article_fields_are_rejected` — 2 assertions
- PASS `test_news_rewrite_json_remains_in_body_for_existing_consumer` — 3 assertions
- PASS `test_provider_http_error_does_not_expose_response_or_key` — 2 assertions
- PASS `test_network_timeout_has_safe_error` — 2 assertions
- PASS `test_timeout_specific_connection_failure_is_generic` — 3 assertions
- PASS `test_refusal_malformed_and_oversized_responses_fail_safely` — 4 assertions
- PASS `test_image_generation_never_makes_an_http_request` — 2 assertions
- PASS `test_container_uses_openai_only_with_explicit_provider_and_nonempty_key` — 3 assertions

### Tests\Feature\SecurityRemediationTest — 9 tests, 163 assertions

- PASS `test_author_ownership_and_protected_create_edit_data` — 18 assertions
- PASS `test_reviewer_and_administrator_keep_authorized_access` — 8 assertions
- PASS `test_publication_rules_across_listing_featured_detail_and_search` — 31 assertions
- PASS `test_pagination_validation_precedes_queries_and_metadata_is_preserved` — 58 assertions
- PASS `test_named_rate_limits_without_a_request_flood` — 9 assertions
- PASS `test_raster_upload_validation_and_generated_filename` — 12 assertions
- PASS `test_explicit_trusted_proxy_scheme_and_ip` — 8 assertions
- PASS `test_hsts_requires_production_https_and_explicit_opt_in` — 7 assertions
- PASS `test_security_headers_and_untrusted_forwarded_headers` — 12 assertions

### Tests\Feature\SyncRssNewsModerationTest — 3 tests, 13 assertions

- PASS `test_dry_run_does_not_write_news_or_categories` — 3 assertions
- PASS `test_new_rss_stories_are_pending_and_existing_review_status_is_preserved` — 5 assertions
- PASS `test_rss_sync_does_not_overwrite_published_editorial_copy` — 5 assertions


## Final authenticated browser acceptance — 2026-10-31

**PASS: 73 final browser checks, zero failures**, using headless Chrome through Playwright and the actual Filament admin login. The three requested viewports completed News and Blog database-backed workflows. Final run results: [results.json](../tests/browser/evidence/results.json). Focus-only diagnostics: [focus-results.json](../tests/browser/evidence/focus-results.json). The full backend suite was not repeated. The five targeted backend acceptance tests passed with **98 assertions** after the error-placement and uniqueness fixes. `git diff --check` passed.

### Isolation and persistence

The latest browser-testing authorization was implemented with a newly created disposable SQLite file so sessions and records survive real HTTP requests. It was not an in-memory browser database. Both the verified database and all runtime storage are under the new marked temporary directory `meritlives-editorial-browser-8dcbda4b2e0e432486f3e5769d5f199a`. No MySQL/WordPress/production connection was available. The bootstrap removes every connection except SQLite, rejects any other SQLite path, forces `AI_EDITORIAL_ENABLED=true` and `AI_EDITORIAL_PROVIDER=mock`, disables AI Studio, and blocks stray Laravel HTTP requests. The browser blocks every origin except `http://127.0.0.1:3187`.

Authentication used factory-created disposable editor accounts through the normal login form, with ordinary sessions and CSRF. No authentication bypass was used. The local server was bound only to loopback and stopped after testing. Temporary SQLite/storage is retained for review; it contains only fictional QA records and disposable users.

[Database evidence](../tests/browser/evidence/database-state.json) records SQLite driver/path, the sole `sqlite` connection, mock provider, separate storage path, all saved fixtures and zero publicly eligible News/Blog records. Across diagnostic and final runs, 8 News records are pending, all with null publication dates and featured=false; 7 Blog records are draft, unapproved, with null publication dates and featured=false. The final run created three News and three Blog records, one pair per viewport. The older rows are disposable diagnostic drafts. News headline/body application was selective; original slug and excerpt were preserved. Blog introduction replacement preserved the later evidence paragraph. Both local public APIs returned empty listings at every viewport.

### Viewport results

| Viewport | News | Blog | Keyboard/focus | Validation/loading | Layout | Final checks |
|---|---|---|---|---|---|---|
| 390 x 1000 | PASS | PASS | PASS | PASS | PASS | 24/24 |
| 768 x 1000 | PASS | PASS | PASS | PASS | PASS | 24/24 |
| 1440 x 1000 | PASS | PASS | PASS | PASS | PASS | 25/25 |

The extra desktop check deliberately reused an existing disposable News source URL to verify field-level duplicate validation. The mobile drawer was dismissed using its normal backdrop before editor actions. Assist and preview dialogs fit within viewport bounds; pages had no horizontal overflow. Initial modal focus, keyboard activation, Tab/Shift+Tab containment, Escape close, focus return, and reopening the retained preview passed. No uncaught JavaScript errors occurred in the final run.

### Scenarios executed

| Scenario | 390px | 768px | 1440px |
|---|---|---|---|
| Guest editor route redirects to login | PASS | PASS | PASS |
| Actual admin login | PASS | PASS | PASS |
| Modal opens with focus inside | PASS | PASS | PASS |
| Tab stays inside modal | PASS | PASS | PASS |
| Shift Tab stays inside modal | PASS | PASS | PASS |
| AI modal fits viewport | PASS | PASS | PASS |
| Escape closes and returns focus | PASS | PASS | PASS |
| Missing News source error beside source field | PASS | PASS | PASS |
| Generation shows loading indicator | PASS | PASS | PASS |
| Generation preserves original editor title | PASS | PASS | PASS |
| Suggestion preview fits viewport | PASS | PASS | PASS |
| Review closes and restores focus; preview can reopen | PASS | PASS | PASS |
| News preview complete and no fields preselected | PASS | PASS | PASS |
| Replacement confirmation required | PASS | PASS | PASS |
| Edited preview selectively applies and preserves unselected fields | PASS | PASS | PASS |
| Duplicate News source rejected beside field without server error | NOT VERIFIED (desktop-only extra check) | NOT VERIFIED (desktop-only extra check) | PASS |
| News database save forces pending despite published selection | PASS | PASS | PASS |
| Blog outline applies only on confirmation | PASS | PASS | PASS |
| Blog introduction preserves remaining unsaved content | PASS | PASS | PASS |
| Blog SEO applies without replacing body | PASS | PASS | PASS |
| Existing Blog category selectable and applied | PASS | PASS | PASS |
| Blog database save forces draft and clears approval | PASS | PASS | PASS |
| Page has no horizontal overflow | PASS | PASS | PASS |
| Saved drafts excluded from local public News and Blog APIs | PASS | PASS | PASS |
| No uncaught browser errors | PASS | PASS | PASS |

### Defects discovered and fixed

1. **Missing-source error placement:** service validation used unscoped keys, so Filament did not display the error next to the modal field. Generation now remaps validation errors to the mounted action form state path. Browser screenshots confirm the message beneath Source text at all viewports. The same mapping supports other service validation errors without weakening validation.
2. **Focus lost on Escape:** Livewire unmounted the action and focus fell to the document body. The existing action triggers now restore focus after unmount, with a bounded wait. Both Assist and Review focus-return checks pass at all viewports. An intermediate attribute-escaping issue introduced while implementing this fix was caught by browser checks and corrected using trusted static `HtmlString` attributes. Final JavaScript error checks are clean.
3. **Duplicate News source URL caused a 500:** the SQLite uniqueness constraint existed but the editor form lacked matching validation. Added `unique(ignoreRecord: true)` to the source URL field. The browser now shows an inline error, retains the draft, and saves successfully after correcting the URL. A focused Livewire regression test verifies no duplicate write.

No publication/approval/authentication controls were weakened. Existing application design was retained. Initial harness issues (incorrect landing-route/modal selectors, a sidebar covering direct clicks, too-short initial PHP request limit, reused fixture URLs and checking before a response arrived) were corrected in the harness. They are not final editor failures.

### Screenshot evidence

Screenshots were inspected for field-error placement and layout. Full-page captures include underlying page content beyond the viewport while modal overlays are fixed; they do not represent a modal scroll stitch. External fonts and avatar requests were intentionally blocked, so missing external avatar images/fallback fonts are expected test artifacts.

#### 390px

- [news-assist](../tests/browser/evidence/390-news-assist.png)
- [news-source-validation](../tests/browser/evidence/390-news-source-validation.png)
- [news-loading](../tests/browser/evidence/390-news-loading.png)
- [news-confirmation](../tests/browser/evidence/390-news-confirmation.png)
- [news-saved](../tests/browser/evidence/390-news-saved.png)
- [blog-outline](../tests/browser/evidence/390-blog-outline.png)
- [blog-category](../tests/browser/evidence/390-blog-category.png)
- [blog-saved](../tests/browser/evidence/390-blog-saved.png)

#### 768px

- [news-assist](../tests/browser/evidence/768-news-assist.png)
- [news-source-validation](../tests/browser/evidence/768-news-source-validation.png)
- [news-loading](../tests/browser/evidence/768-news-loading.png)
- [news-confirmation](../tests/browser/evidence/768-news-confirmation.png)
- [news-saved](../tests/browser/evidence/768-news-saved.png)
- [blog-outline](../tests/browser/evidence/768-blog-outline.png)
- [blog-category](../tests/browser/evidence/768-blog-category.png)
- [blog-saved](../tests/browser/evidence/768-blog-saved.png)

#### 1440px

- [news-assist](../tests/browser/evidence/1440-news-assist.png)
- [news-source-validation](../tests/browser/evidence/1440-news-source-validation.png)
- [news-loading](../tests/browser/evidence/1440-news-loading.png)
- [news-confirmation](../tests/browser/evidence/1440-news-confirmation.png)
- [news-saved](../tests/browser/evidence/1440-news-saved.png)
- [blog-outline](../tests/browser/evidence/1440-blog-outline.png)
- [blog-category](../tests/browser/evidence/1440-blog-category.png)
- [blog-saved](../tests/browser/evidence/1440-blog-saved.png)

Additional desktop evidence: [duplicate-source validation](../tests/browser/evidence/1440-news-duplicate-source.png). Initial `failure*.png` and `*-failure.png` images are diagnostic history, not final acceptance states.

### Files changed in the browser acceptance continuation

- `app/Filament/Resources/Concerns/HasEditorialAssistant.php`: modal validation paths and focus restoration.
- `app/Filament/Resources/NewsResource.php`: duplicate source URL form validation only; prior unrelated modifications retained.
- `tests/Feature/EditorialAcceptanceTest.php`: assertion updated to require modal-scoped errors, plus duplicate-source regression test.
- `tests/browser/editorial-app.php`, `tests/browser/README.md`, `tests/browser/run-root.txt`: isolated harness and reproduction instructions.
- `frontend/tests/editorial-browser.cjs`: browser acceptance runner.
- This report and `tests/browser/evidence/`: results, screenshots and disposable database evidence.

### Remaining blockers and limits

No remaining blocker for the requested mock-provider browser scenarios. Real OpenAI calls/credits/model quality and live quota behavior remain NOT VERIFIED intentionally. Provider failures, quota and malformed output were verified with backend fakes in the prior acceptance; they were not injected into the browser in this pass. Manual screen-reader testing and browsers other than Chrome were not performed. The mock provider deliberately returns null category suggestions; the existing category options and explicit editor selection/application were verified. No production access, publication, deployment, push, real AI request, or environment-file change occurred.