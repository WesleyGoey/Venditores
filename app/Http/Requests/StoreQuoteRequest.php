<?php

namespace App\Http\Requests;

use App\Enums\QuoteStatus;
use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreQuoteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): Response
    {
        return Gate::inspect('update', $this->route('event'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'vendor_name' => ['required', 'string', 'max:255'],
            'vendor_contact' => ['nullable', 'string', 'max:255'],
            'price' => ['required', 'integer', 'min:0', 'max:'.StoreEventRequest::MAX_BUDGET],
            'notes' => ['nullable', 'string', 'max:5000'],
            'status' => ['sometimes', Rule::enum(QuoteStatus::class)],
        ];
    }
}
