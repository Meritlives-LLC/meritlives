# AI Editorial Assistant

## Audit and integration

The admin dashboard is Filament 3 (Laravel), not the public Next.js application. News and Blog already have create/edit resource pages, rich-text `content`, excerpt, slug and SEO fields. News also has source attribution. Blog has no source columns; its source inputs provide context for suggestions and are not persisted as new fields. Both use the existing Category model; News currently offers Technology, Business and Insights, while Blog offers active blog categories.

Existing resource permissions govern every generation and apply action. Blog author ownership checks remain in force. Public News requires published status and a nonfuture publication date; Blog additionally requires public approval. The assistant does not change those eligibility scopes or the existing AI Studio/News Discovery workflows. Existing AI Studio uses Chat Completions; editorial assistance adds a Responses API adapter alongside it, using its backend key and timeout configuration. The Laravel HTTP client, existing role permissions and Laravel rate limiter are reused. No public AI API or client-side key is introduced.

The repository contained extensive tracked and untracked work at implementation time. That work was retained. No migration is required by this feature.

## Development without credits

Set these backend environment values, then clear cached configuration through your normal deployment procedure:

```dotenv
AI_EDITORIAL_ENABLED=true
AI_EDITORIAL_PROVIDER=mock
```

Open an existing News or Blog create/edit page. Click **AI Assist**, choose an operation and supply inputs. News always requires pasted source text or editor-verified facts. URLs are not fetched. Mock suggestions are clearly labelled and make no network calls; they demonstrate the workflow rather than simulate real journalism.

After generating, click **Review AI suggestions**, edit the proposed fields, check the verification checklist, select fields and explicitly confirm replacement. No fields are selected initially. Applying changes only the open form. Save separately. Applying any suggestion forces that save to pending News or draft Blog, clears publication date and featured status, and revokes Blog public approval. Even changing publication fields before this save cannot publish the AI-assisted result. Reopen the saved draft for the existing review/publication workflow.

Outline and introduction output are offered as body suggestions. Applying an introduction replaces the first HTML paragraph and preserves the rest of the article (or prepends it if no paragraph exists). Applying an outline replaces the body. Headline, SEO and category operations can only apply their corresponding fields. Category recommendations are optional and must still be active and of the correct content type when applied. Slug uniqueness remains enforced by the existing article form.

## OpenAI configuration

```dotenv
AI_EDITORIAL_ENABLED=true
AI_EDITORIAL_PROVIDER=openai
OPENAI_API_KEY=your-backend-secret
OPENAI_MODEL=your-supported-responses-model
```

No live credits are needed for development or tests. No real provider call was used for validation. Unsupported providers fail closed. HTTP 429, including insufficient credits, gives a safe actionable message and leaves the article unchanged. There are no automatic retries, fetching tools or publishing tools. Requests use `store: false`, bounded response reads, connection/request timeouts and strict JSON Schema output with independent Laravel validation. See [OpenAI structured output documentation](https://developers.openai.com/api/docs/guides/structured-outputs).

Inputs have field-level limits (16,000 characters each for source and existing text); each user can generate five times per minute across both content types. Suggestions expire after 30 minutes and are kept in the existing server session, not article records. Generation does not log prompts, keys or unpublished content. Standard session storage/security settings apply. Model instructions prohibit invented facts and lengthy source reproduction; factual accuracy and originality still require human review.

Tests: `php -d extension=pdo_sqlite -d extension=sqlite3 vendor/bin/phpunit tests/Feature/AiEditorialAssistantTest.php` (in-memory SQLite). The submitted requirements stop at Blog “Improve introduction”; no unspecified later requirements are assumed.
