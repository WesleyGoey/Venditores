<?php

namespace App\Http\Requests;

use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateEventRequest extends FormRequest
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
        // Unlike creating, an existing event always keeps its core details.
        return [
            ...(new StoreEventRequest)->rules(),
            'name' => ['required', 'string', 'max:255'],
            'event_date' => ['required', 'date'],
            'total_budget' => ['required', 'integer', 'min:0', 'max:'.StoreEventRequest::MAX_BUDGET],
        ];
    }
}
