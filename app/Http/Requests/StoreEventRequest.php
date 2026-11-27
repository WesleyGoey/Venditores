<?php


namespace App\Http\Requests;


use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;


class StoreEventRequest extends FormRequest
{
    /**
     * Largest accepted budget in Rupiah (Rp 10 trillion).
     */
    public const MAX_BUDGET = 10_000_000_000_000;


    /**
     * Largest accepted proposal size in kilobytes (10 MB).
     */
    public const MAX_PROPOSAL_KILOBYTES = 10_240;


    /**
     * What the form reads from the proposal beyond the event details: the vendor needs and the event profile.
     */
    public const ANALYSIS_FIELDS = ['summary', 'scale', 'estimated_attendees', 'vendor_needs'];


    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // With a proposal PDF these can stay empty, the AI fills them in.
            'name' => ['required_without:proposal', 'nullable', 'string', 'max:255'],
            'event_date' => ['required_without:proposal', 'nullable', 'date'],
            'location' => ['nullable', 'string', 'max:255'],
            'total_budget' => ['required_without:proposal', 'nullable', 'integer', 'min:0', 'max:'.self::MAX_BUDGET],
            'description' => ['nullable', 'string', 'max:5000'],
            'proposal' => ['nullable', 'file', 'mimes:pdf', 'max:'.self::MAX_PROPOSAL_KILOBYTES],
            // Read from the proposal while the form was open. Percentages only: the Rupiah split uses the final budget.
            'summary' => ['nullable', 'string', 'max:2000'],
            'scale' => ['nullable', Rule::in(['small', 'medium', 'large'])],
            'estimated_attendees' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'vendor_needs' => ['nullable', 'array', 'max:30'],
            'vendor_needs.*.category' => ['required', 'string', 'max:255'],
            'vendor_needs.*.specification' => ['nullable', 'string', 'max:5000'],
            'vendor_needs.*.allocation_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'vendor_needs.*.is_vital' => ['boolean'],
        ];
    }
}
